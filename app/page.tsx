import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthButton } from "@/components/auth-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, MessageCircle, Star } from "lucide-react";
import Link from "next/link";

export default async function Index() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is authenticated, redirect to family feed
  if (user) {
    return redirect("/protected");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="w-full flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="flex items-center space-x-2">
          <Heart className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Origins</h1>
        </div>
        <AuthButton />
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Keep Your Family
            <span className="text-purple-600"> Connected </span>
            Through Memories
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Origins is a familial knowledge base and reminisce therapy tool
            designed to help families stay connected and help those with
            Alzheimer&apos;s remember their loved ones and engage with precious
            memories.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" className="text-lg px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Family Feed
              </h3>
              <p className="text-gray-600">
                Share updates, milestones, and memories with your family in a
                beautiful timeline.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Family Tree
              </h3>
              <p className="text-gray-600">
                Visualize your family connections and add new members to your
                growing tree.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI Family Assistant
              </h3>
              <p className="text-gray-600">
                Chat with an AI that knows your family history, photos, and
                stories.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Reminisce Therapy
              </h3>
              <p className="text-gray-600">
                Specially designed tools to help elders engage with memories and
                family stories.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardContent className="p-12 text-center">
            <h3 className="text-3xl font-bold mb-4">
              Start Preserving Your Family&apos;s Story Today
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Join families who are already using Origins to stay connected and
              preserve their precious memories.
            </p>
            <Link href="/auth/sign-up">
              <Button className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-3">
                Create Your Family Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="w-6 h-6 text-purple-600" />
            <span className="text-lg font-semibold text-gray-900">Origins</span>
          </div>
          <p className="text-gray-600">
            Connecting families through memories, one story at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}
