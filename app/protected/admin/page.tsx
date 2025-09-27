import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { extractAllExistingContext } from "@/lib/actions/context-extraction";
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          FamilyGPT Admin
        </h1>
        <p className="text-gray-600">Manage context extraction and AI system</p>
      </div>

      {/* Context Status */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            Context Status
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {contextCount || 0}
              </div>
              <p className="text-gray-600">User Context Entries</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {familyContextCount || 0}
              </div>
              <p className="text-gray-600">Family Context Entries</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Context Extraction */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            Context Extraction
          </h2>
          <p className="text-gray-600">
            Extract context from existing posts, memories, and profiles to
            populate the FamilyGPT knowledge base.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This will process all existing posts,
              memories, and profiles to create context entries. Run this once to
              populate the knowledge base.
            </p>
          </div>

          <form action={runContextExtraction}>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Extract All Context
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sample Context Preview */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Context Entries
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* We'll show some sample entries here */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Sample Post Context
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  post
                </span>
              </div>
              <p className="text-sm text-gray-800">
                Title: New haircut
                <br />
                Description: Barber got me right
                <br />
                Author: wangbenjamin05 (member)
                <br />
                Post Type: general
                <br />
                Date: {new Date().toLocaleDateString()}
              </p>
            </div>

            <div className="text-center text-gray-500">
              <p>
                Run context extraction to see actual entries from your database
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
