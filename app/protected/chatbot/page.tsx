import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createChatSession, getChatMessages } from "@/lib/actions/familygpt";
import { FamilyGPTChat } from "@/components/familygpt-chat";

export default async function ChatbotPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Get or create a chat session for this user
  let sessionId: string;

  // Check if user has an existing session
  const { data: existingSessions } = await supabase
    .from("familygpt_sessions")
    .select("id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (existingSessions && existingSessions.length > 0) {
    sessionId = existingSessions[0].id;
  } else {
    // Create new session
    sessionId = await createChatSession();
  }

  // Get existing messages for this session
  const messages = await getChatMessages(sessionId);

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="text-center py-6 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chat with Family
        </h1>
        <p className="text-gray-600">
          Ask about memories, photos, stories, and family history
        </p>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col min-h-0">
        <FamilyGPTChat sessionId={sessionId} initialMessages={messages} />
      </div>
    </div>
  );
}
