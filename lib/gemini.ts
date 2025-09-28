import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Get the Gemini Flash model
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// Generate response using family context
export async function generateFamilyResponse(
  query: string,
  familyContext: string[]
) {
  try {
    const systemPrompt = `You are Origins AI, a family memory assistant. You have access to your normal knowledge AND special access to this family's memories, posts, and stories.

Instructions:
- Use your normal knowledge and capabilities
- When relevant, incorporate the provided family context into your responses
- If asked about this specific family, prioritize the family context
- For general questions, use your normal knowledge
- Always be warm, helpful, and family-focused
- If you reference family context, mention it naturally (e.g., "Based on your family's posts...")

${
  familyContext.length > 0
    ? `
Family Context Available:
${familyContext.join("\n\n---\n\n")}
`
    : "No specific family context found for this query."
}

User Question: ${query}`;

    const result = await geminiModel.generateContent(systemPrompt);
    const response = result.response;

    return response.text();
  } catch (error) {
    console.error("Error generating Gemini response:", error);
    throw error;
  }
}
