import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { extractAllExistingContext } from "@/lib/actions/context-extraction";
import { generateAllEmbeddings } from "@/lib/actions/embeddings";
import { revalidatePath } from "next/cache";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Check current context count
  const { count: contextCount } = await supabase
    .from("user_context")
    .select("*", { count: "exact", head: true });

  const { count: familyContextCount } = await supabase
    .from("family_context")
    .select("*", { count: "exact", head: true });

  // Check how many have embeddings
  const { count: embeddedContextCount } = await supabase
    .from("user_context")
    .select("*", { count: "exact", head: true })
    .not("embedding", "is", null);

  const { count: embeddedFamilyContextCount } = await supabase
    .from("family_context")
    .select("*", { count: "exact", head: true })
    .not("embedding", "is", null);

  async function runContextExtraction() {
    "use server";

    try {
      await extractAllExistingContext();
      revalidatePath("/protected/admin");
    } catch (error) {
      console.error("Context extraction failed:", error);
      throw error;
    }
  }

  async function runEmbeddingGeneration() {
    "use server";

    try {
      await generateAllEmbeddings();
      revalidatePath("/protected/admin");
    } catch (error) {
      console.error("Embedding generation failed:", error);
      throw error;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          FamilyGPT Admin
        </h1>
        <p className="text-gray-600">Manage context extraction and AI system</p>
      </div>

      {/* Context & Embedding Status */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">System Status</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {contextCount || 0}
              </div>
              <p className="text-gray-600">User Context Entries</p>
            </div>
            <div className="text-center p-6 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-muted-foreground mb-2">
                {familyContextCount || 0}
              </div>
              <p className="text-gray-600">Family Context Entries</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {embeddedContextCount || 0}
              </div>
              <p className="text-gray-600">User Embeddings</p>
            </div>
            <div className="text-center p-6 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {embeddedFamilyContextCount || 0}
              </div>
              <p className="text-gray-600">Family Embeddings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Context Extraction */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            Step 1: Context Extraction
          </h2>
          <p className="text-gray-600">
            Extract context from existing posts, memories, and profiles.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Status:</strong> {contextCount || 0} context entries
              extracted
            </p>
          </div>

          <form action={runContextExtraction}>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Extract All Context
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Embedding Generation */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            Step 2: Generate Embeddings
          </h2>
          <p className="text-gray-600">
            Generate vector embeddings for AI search using OpenAI's
            text-embedding-3-small model.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">
              <strong>Status:</strong> {embeddedContextCount || 0} /{" "}
              {contextCount || 0} user contexts have embeddings
            </p>
            <p className="text-sm text-purple-800">
              <strong>Family:</strong> {embeddedFamilyContextCount || 0} /{" "}
              {familyContextCount || 0} family contexts have embeddings
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> You need an OpenAI API key in your
              environment variables (OPENAI_API_KEY). This will cost
              approximately $0.01-0.05 for a typical family's context.
            </p>
          </div>

          <form action={runEmbeddingGeneration}>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!contextCount}
            >
              Generate All Embeddings
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-muted">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            Step 3: Ready for FamilyGPT
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-gray-700">
              Once embeddings are generated, you can:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Search for similar context using vector similarity</li>
              <li>Build the RAG pipeline with Gemini Flash</li>
              <li>Answer questions like "What school did my mom go to?"</li>
              <li>Tell stories about family members and their memories</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
