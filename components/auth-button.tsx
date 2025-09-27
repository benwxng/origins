import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { getUserDisplayInfo } from "@/lib/utils/profile";
import { getInitials } from "@/lib/utils/display";
import { User } from "lucide-react";

export async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"}>
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" variant={"default"}>
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }

  const userInfo = await getUserDisplayInfo(user);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          {userInfo.avatarUrl ? (
            <img
              src={userInfo.avatarUrl}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-gray-600 font-semibold text-sm">
              {getInitials(userInfo.fullName)}
            </span>
          )}
        </div>
        <span className="text-gray-700">Hey, {userInfo.fullName}!</span>
      </div>
      <LogoutButton />
    </div>
  );
}
