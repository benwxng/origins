import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getMemories, getFamilyMembers } from "@/lib/actions/memories";
import { ReminiscePage } from "@/components/reminisce-page";

export default async function ReminiscePageServer() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Fetch real memories and family members
  const memories = await getMemories();
  const familyMembers = await getFamilyMembers();

  const initialPrompts = [
    "Tell me about your wedding day",
    "What was your favorite childhood memory?",
    "Describe a special family tradition",
    "What was your first job like?",
    "Tell me about when your children were born",
    "What was your favorite place to visit?",
  ];

  return (
    <ReminiscePage
      memories={memories}
      familyMembers={familyMembers}
      initialPrompts={initialPrompts}
    />
  );
}
