import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GenerationFamilyTree from "@/components/generation-family-tree";

export default async function FamilyTreePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  return (
    <div className="w-full h-screen">
      <GenerationFamilyTree />
    </div>
  );
}
