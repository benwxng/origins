"use server";

import { createClient } from "@/lib/supabase/server";
import { generateContextEmbedding } from "./embeddings";

// Types for context extraction
interface ContextEntry {
  raw_text: string;
  source_type: string;
  source_id: string;
  metadata: any;
  family_member_id?: string;
  user_id?: string;
}

// Extract context from family posts
export async function extractPostContext(postId?: string) {
  const supabase = await createClient();

  try {
    console.log(`🔍 Starting extractPostContext for postId: ${postId}`);

    // Simple query - just get the post
    let query = supabase.from("family_posts").select("*");

    if (postId) {
      query = query.eq("id", postId);
    }

    const { data: posts, error } = await query;

    console.log(`📊 Found ${posts?.length || 0} posts for context extraction`);

    if (error) {
      console.error("❌ Error in extractPostContext query:", error);
      throw error;
    }

    if (!posts || posts.length === 0) {
      console.log("❌ No posts found");
      return { success: true, count: 0 };
    }

    // Get author info separately
    const authorIds = posts.map((post) => post.author_id).filter(Boolean);
    const { data: authors, error: authorError } = await supabase
      .from("family_members")
      .select("id, user_id, full_name, relationship")
      .in("id", authorIds);

    if (authorError) {
      console.error("❌ Error fetching authors:", authorError);
      throw authorError;
    }

    console.log(`👥 Found ${authors?.length || 0} authors`);

    const contextEntries = [];

    for (const post of posts) {
      const author = authors?.find((a) => a.id === post.author_id);

      if (!author) {
        console.log(`⚠️ No author found for post ${post.id}`);
        continue;
      }

      console.log(`📝 Processing post: ${post.id} by ${author.full_name}`);

      // Parse title and description from content
      const contentLines = post.content.split("\n\n");
      const title = contentLines[0] || "";
      const description = contentLines.slice(1).join("\n\n") || "";

      // Create rich context text
      const contextText = `
Title: ${title}
Description: ${description}
Author: ${author.full_name} (${author.relationship})
Post Type: ${post.post_type}
Date: ${new Date(post.created_at).toLocaleDateString()}
${
  post.image_urls?.length
    ? `Images: ${post.image_urls.length} photos attached`
    : ""
}
      `.trim();

      // Extract metadata
      const metadata = {
        title,
        post_type: post.post_type,
        date: post.created_at.split("T")[0],
        author: author.full_name,
        author_relationship: author.relationship,
        has_images: post.image_urls?.length > 0,
        image_count: post.image_urls?.length || 0,
        tags: extractTags(title + " " + description),
      };

      contextEntries.push({
        raw_text: contextText,
        source_type: "post",
        source_id: post.id,
        metadata,
        family_member_id: author.id,
        user_id: author.user_id,
      });
    }

    console.log(`💾 Inserting ${contextEntries.length} context entries`);

    // Insert into user_context table
    for (const entry of contextEntries) {
      console.log(`💾 Inserting context for post ${entry.source_id}`);

      const { data: insertedContext, error: insertError } = await supabase
        .from("user_context")
        .insert({
          user_id: entry.user_id,
          family_member_id: entry.family_member_id,
          raw_text: entry.raw_text,
          source_type: entry.source_type,
          source_id: entry.source_id,
          metadata: entry.metadata,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("❌ Error inserting post context:", insertError);
        continue;
      }

      console.log(`✅ Inserted context entry: ${insertedContext?.id}`);

      // 🚀 AUTO-GENERATE EMBEDDING for new context
      if (insertedContext) {
        try {
          console.log(
            `🧠 Generating embedding for context: ${insertedContext.id}`
          );
          await generateContextEmbedding(insertedContext.id, "user_context");
          console.log(
            `✅ Generated embedding for post context: ${insertedContext.id}`
          );
        } catch (embeddingError) {
          console.error("⚠️ Failed to generate embedding:", embeddingError);
          // Continue even if embedding fails
        }
      }
    }

    console.log(`✅ Extracted context from ${contextEntries.length} posts`);
    return { success: true, count: contextEntries.length };
  } catch (error) {
    console.error("❌ Error extracting post context:", error);
    throw error;
  }
}

// Extract context from memories
export async function extractMemoryContext(memoryId?: string) {
  const supabase = await createClient();

  try {
    let query = supabase.from("memories").select(`
        *,
        family_members!inner(
          id,
          user_id,
          full_name,
          relationship
        ),
        created_by_member:family_members!memories_created_by_fkey(
          id,
          user_id,
          full_name,
          relationship
        )
      `);

    if (memoryId) {
      query = query.eq("id", memoryId);
    }

    const { data: memories, error } = await query;

    if (error) throw error;

    const contextEntries: ContextEntry[] = [];

    for (const memory of memories || []) {
      // Create rich context text
      const contextText = `
Memory: ${memory.title}
Description: ${memory.description || "No description provided"}
Subject: ${memory.family_members.full_name} (${
        memory.family_members.relationship
      })
Date of Memory: ${
        memory.memory_date
          ? new Date(memory.memory_date).toLocaleDateString()
          : "Date not specified"
      }
Tags: ${memory.tags?.join(", ") || "No tags"}
Created by: ${memory.created_by_member?.full_name || "Unknown"}
${memory.is_favorite ? "This is a favorite memory" : ""}
${
  memory.image_urls?.length
    ? `Images: ${memory.image_urls.length} photos attached`
    : ""
}
      `.trim();

      // Extract metadata
      const metadata = {
        title: memory.title,
        memory_date: memory.memory_date,
        subject: memory.family_members.full_name,
        subject_relationship: memory.family_members.relationship,
        tags: memory.tags || [],
        is_favorite: memory.is_favorite,
        has_images: memory.image_urls?.length > 0,
        image_count: memory.image_urls?.length || 0,
        created_by: memory.created_by_member?.full_name,
        type: "memory",
      };

      contextEntries.push({
        raw_text: contextText,
        source_type: "memory",
        source_id: memory.id,
        metadata,
        family_member_id: memory.family_member_id,
        user_id: memory.family_members.user_id,
      });
    }

    // Insert into user_context table and generate embeddings
    for (const entry of contextEntries) {
      const { data: insertedContext, error: insertError } = await supabase
        .from("user_context")
        .upsert(
          {
            user_id: entry.user_id,
            family_member_id: entry.family_member_id,
            raw_text: entry.raw_text,
            source_type: entry.source_type,
            source_id: entry.source_id,
            metadata: entry.metadata,
          },
          {
            onConflict: "source_type,source_id",
            ignoreDuplicates: false,
          }
        )
        .select("id")
        .single();

      if (insertError) {
        console.error("Error inserting memory context:", insertError);
        continue;
      }

      // 🚀 AUTO-GENERATE EMBEDDING for new context
      if (insertedContext) {
        try {
          await generateContextEmbedding(insertedContext.id, "user_context");
          console.log(
            `✅ Generated embedding for memory context: ${insertedContext.id}`
          );
        } catch (embeddingError) {
          console.error("⚠️ Failed to generate embedding:", embeddingError);
          // Continue even if embedding fails
        }
      }
    }

    console.log(`Extracted context from ${contextEntries.length} memories`);
    return { success: true, count: contextEntries.length };
  } catch (error) {
    console.error("Error extracting memory context:", error);
    throw error;
  }
}

// Extract context from family member profiles
export async function extractProfileContext(memberId?: string) {
  const supabase = await createClient();

  try {
    let query = supabase.from("family_members").select("*");

    if (memberId) {
      query = query.eq("id", memberId);
    }

    const { data: members, error } = await query;

    if (error) throw error;

    const contextEntries: ContextEntry[] = [];

    for (const member of members || []) {
      // Create rich context text from profile
      const contextText = `
Person: ${member.full_name}
Relationship: ${member.relationship}
Birth Date: ${
        member.birth_date
          ? new Date(member.birth_date).toLocaleDateString()
          : "Not specified"
      }
Bio: ${member.bio || "No bio provided"}
${member.is_elder ? "This person is marked as an elder in the family" : ""}
Profile created: ${new Date(member.created_at).toLocaleDateString()}
      `.trim();

      // Extract metadata
      const metadata = {
        full_name: member.full_name,
        relationship: member.relationship,
        birth_date: member.birth_date,
        is_elder: member.is_elder,
        has_bio: !!member.bio,
        type: "profile",
        tags: member.bio ? extractTags(member.bio) : [],
      };

      contextEntries.push({
        raw_text: contextText,
        source_type: "profile",
        source_id: member.id,
        metadata,
        family_member_id: member.id,
        user_id: member.user_id,
      });
    }

    // Insert into user_context table and generate embeddings
    for (const entry of contextEntries) {
      if (entry.user_id) {
        // Only insert if user_id exists
        const { data: insertedContext, error: insertError } = await supabase
          .from("user_context")
          .upsert(
            {
              user_id: entry.user_id,
              family_member_id: entry.family_member_id,
              raw_text: entry.raw_text,
              source_type: entry.source_type,
              source_id: entry.source_id,
              metadata: entry.metadata,
            },
            {
              onConflict: "source_type,source_id",
              ignoreDuplicates: false,
            }
          )
          .select("id")
          .single();

        if (insertError) {
          console.error("Error inserting profile context:", insertError);
          continue;
        }

        // 🚀 AUTO-GENERATE EMBEDDING for new context
        if (insertedContext) {
          try {
            await generateContextEmbedding(insertedContext.id, "user_context");
            console.log(
              `✅ Generated embedding for profile context: ${insertedContext.id}`
            );
          } catch (embeddingError) {
            console.error("⚠️ Failed to generate embedding:", embeddingError);
            // Continue even if embedding fails
          }
        }
      }
    }

    console.log(`Extracted context from ${contextEntries.length} profiles`);
    return { success: true, count: contextEntries.length };
  } catch (error) {
    console.error("Error extracting profile context:", error);
    throw error;
  }
}

// Extract all existing context (run this once to populate)
export async function extractAllExistingContext() {
  try {
    console.log("Starting full context extraction...");

    const postResult = await extractPostContext();
    const memoryResult = await extractMemoryContext();
    const profileResult = await extractProfileContext();

    const totalCount =
      postResult.count + memoryResult.count + profileResult.count;

    console.log(`Context extraction complete! Total entries: ${totalCount}`);
    console.log(`- Posts: ${postResult.count}`);
    console.log(`- Memories: ${memoryResult.count}`);
    console.log(`- Profiles: ${profileResult.count}`);

    return {
      success: true,
      total: totalCount,
      breakdown: {
        posts: postResult.count,
        memories: memoryResult.count,
        profiles: profileResult.count,
      },
    };
  } catch (error) {
    console.error("Error in full context extraction:", error);
    throw error;
  }
}

// Helper function to extract tags from text
function extractTags(text: string): string[] {
  if (!text) return [];

  const commonWords = [
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "is",
    "was",
    "are",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "can",
    "this",
    "that",
    "these",
    "those",
  ];

  // Extract meaningful words (3+ characters, not common words)
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(
      (word) =>
        word.length >= 3 && !commonWords.includes(word) && isNaN(Number(word))
    );

  // Get unique words, limit to top 10 most relevant
  const uniqueWords = [...new Set(words)];
  return uniqueWords.slice(0, 10);
}
