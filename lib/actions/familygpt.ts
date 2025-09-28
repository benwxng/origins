"use server";

import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/openai";
import { generateFamilyResponse } from "@/lib/gemini";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Create a new FamilyGPT chat session
export async function createChatSession() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Get user's family member record
  const { data: familyMember } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!familyMember) {
    throw new Error("Family member record not found");
  }

  // Create new chat session
  const { data: session, error } = await supabase
    .from("familygpt_sessions")
    .insert({
      user_id: user.id,
      family_member_id: familyMember.id,
    })
    .select("id")
    .single();

  if (error) throw error;

  return session.id;
}

// Send a message to FamilyGPT and get response
export async function sendFamilyGPTMessage(sessionId: string, message: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  try {
    console.log(`🤖 Processing FamilyGPT query: "${message}"`);

    // 1. Generate embedding for the user's question
    const queryEmbedding = await generateEmbedding(message);
    console.log("🧠 Generated query embedding");

    // 2. Search for relevant family context using vector similarity
    const { data: similarContext, error: searchError } = await supabase.rpc(
      "search_family_context",
      {
        query_embedding: queryEmbedding,
        similarity_threshold: 0.3, // Lower threshold for more results
        match_count: 8,
      }
    );

    console.log("🔍 Vector search result:", similarContext);
    console.log("🔍 Search error:", searchError);

    if (searchError) {
      console.error("Error searching family context:", searchError);
      // Don't throw - continue with empty context
      console.log("⚠️ Continuing without vector search due to error");
    }

    console.log(
      `🔍 Found ${similarContext?.length || 0} relevant context entries`
    );
    if (similarContext && similarContext.length > 0) {
      console.log(
        "📋 Context previews:",
        similarContext.map((ctx: any) => ({
          similarity: ctx.similarity,
          preview: ctx.raw_text.substring(0, 100) + "...",
        }))
      );
    }

    // 3. Prepare context for Gemini
    const familyContextTexts =
      similarContext?.map(
        (ctx: any) =>
          `${ctx.raw_text} (Similarity: ${(ctx.similarity * 100).toFixed(1)}%)`
      ) || [];

    // 4. Generate response using Gemini Flash (always call, even with no context)
    console.log("🤖 Generating Gemini response");
    const responseText = await generateFamilyResponse(
      message,
      familyContextTexts
    );

    console.log("✅ Generated FamilyGPT response");

    // 5. Save user message
    await supabase.from("familygpt_messages").insert({
      session_id: sessionId,
      role: "user",
      content: message,
    });

    // 6. Save assistant response with context used
    const contextIds = similarContext?.map((ctx: any) => ctx.id) || [];
    await supabase.from("familygpt_messages").insert({
      session_id: sessionId,
      role: "assistant",
      content: responseText,
      context_used: contextIds,
    });

    revalidatePath("/protected/chatbot");

    return {
      success: true,
      response: responseText,
      contextUsed: similarContext?.length || 0,
    };
  } catch (error) {
    console.error("Error in sendFamilyGPTMessage:", error);
    throw error;
  }
}

// Get chat messages for a session
export async function getChatMessages(sessionId: string) {
  const supabase = await createClient();

  const { data: messages, error } = await supabase
    .from("familygpt_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching chat messages:", error);
    return [];
  }

  return messages || [];
}

// Get user's chat sessions
export async function getUserChatSessions() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: sessions, error } = await supabase
    .from("familygpt_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching chat sessions:", error);
    return [];
  }

  return sessions || [];
}
