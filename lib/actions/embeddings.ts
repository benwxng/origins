"use server";

import { createClient } from "@/lib/supabase/server";
import { generateEmbedding, generateEmbeddings } from "@/lib/openai";

// Generate embeddings for all context entries that don't have them yet
export async function generateAllEmbeddings() {
  const supabase = await createClient();

  try {
    console.log("🚀 Starting embedding generation...");

    // Get all user_context entries without embeddings
    const { data: userContexts, error: userError } = await supabase
      .from("user_context")
      .select("id, raw_text")
      .is("embedding", null)
      .limit(100); // Process in batches to avoid rate limits

    if (userError) {
      console.error("Error fetching user contexts:", userError);
      throw userError;
    }

    // Get all family_context entries without embeddings
    const { data: familyContexts, error: familyError } = await supabase
      .from("family_context")
      .select("id, raw_text")
      .is("embedding", null)
      .limit(100);

    if (familyError) {
      console.error("Error fetching family contexts:", familyError);
      throw familyError;
    }

    let processedCount = 0;

    // Process user contexts
    if (userContexts && userContexts.length > 0) {
      console.log(
        `📝 Processing ${userContexts.length} user context entries...`
      );

      for (const context of userContexts) {
        try {
          const embedding = await generateEmbedding(context.raw_text);

          const { error: updateError } = await supabase
            .from("user_context")
            .update({ embedding })
            .eq("id", context.id);

          if (updateError) {
            console.error(
              `Error updating embedding for context ${context.id}:`,
              updateError
            );
          } else {
            processedCount++;
            console.log(
              `✅ Generated embedding ${processedCount}: ${context.id}`
            );
          }

          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error processing context ${context.id}:`, error);
        }
      }
    }

    // Process family contexts
    if (familyContexts && familyContexts.length > 0) {
      console.log(
        `👨‍👩‍👧‍👦 Processing ${familyContexts.length} family context entries...`
      );

      for (const context of familyContexts) {
        try {
          const embedding = await generateEmbedding(context.raw_text);

          const { error: updateError } = await supabase
            .from("family_context")
            .update({ embedding })
            .eq("id", context.id);

          if (updateError) {
            console.error(
              `Error updating embedding for family context ${context.id}:`,
              updateError
            );
          } else {
            processedCount++;
            console.log(
              `✅ Generated family embedding ${processedCount}: ${context.id}`
            );
          }

          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(
            `Error processing family context ${context.id}:`,
            error
          );
        }
      }
    }

    console.log(
      `🎉 Embedding generation complete! Processed ${processedCount} entries.`
    );

    return {
      success: true,
      processed: processedCount,
      userContexts: userContexts?.length || 0,
      familyContexts: familyContexts?.length || 0,
    };
  } catch (error) {
    console.error("Error in generateAllEmbeddings:", error);
    throw error;
  }
}

// Generate embedding for a single new context entry
export async function generateContextEmbedding(
  contextId: string,
  contextType: "user_context" | "family_context"
) {
  const supabase = await createClient();

  try {
    // Get the context entry
    const { data: context, error: fetchError } = await supabase
      .from(contextType)
      .select("id, raw_text")
      .eq("id", contextId)
      .single();

    if (fetchError || !context) {
      throw new Error(`Context entry not found: ${contextId}`);
    }

    // Generate embedding
    const embedding = await generateEmbedding(context.raw_text);

    // Update the context with the embedding
    const { error: updateError } = await supabase
      .from(contextType)
      .update({ embedding })
      .eq("id", contextId);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Generated embedding for ${contextType}: ${contextId}`);
    return { success: true };
  } catch (error) {
    console.error(
      `Error generating embedding for ${contextType} ${contextId}:`,
      error
    );
    throw error;
  }
}

// Search for similar context using vector similarity
export async function searchSimilarContext(query: string, limit: number = 5) {
  const supabase = await createClient();

  try {
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // Search user contexts
    const { data: userResults, error: userError } = await supabase.rpc(
      "search_user_context",
      {
        query_embedding: queryEmbedding,
        similarity_threshold: 0.7,
        match_count: limit,
      }
    );

    // Search family contexts
    const { data: familyResults, error: familyError } = await supabase.rpc(
      "search_family_context",
      {
        query_embedding: queryEmbedding,
        similarity_threshold: 0.7,
        match_count: limit,
      }
    );

    // Combine and sort results by similarity
    const allResults = [
      ...(userResults || []).map((r: any) => ({ ...r, context_type: "user" })),
      ...(familyResults || []).map((r: any) => ({
        ...r,
        context_type: "family",
      })),
    ].sort((a, b) => b.similarity - a.similarity);

    return allResults.slice(0, limit);
  } catch (error) {
    console.error("Error searching similar context:", error);
    throw error;
  }
}
