import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, Users, Play, Star } from "lucide-react";

export default async function ReminiscePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Placeholder memories data - will be replaced with real data later
  const featuredMemories = [
    {
      id: 1,
      title: "Wedding Day",
      description:
        "The most beautiful day of our lives. Eleanor looked stunning in her white dress, and we danced until midnight.",
      date: "June 20, 1955",
      decade: "1950s",
      tags: ["wedding", "love", "celebration"],
      isFavorite: true,
      imageUrl: null,
    },
    {
      id: 2,
      title: "Margaret&apos;s First Day of School",
      description:
        "She was so excited wearing her favorite blue dress with polka dots. She couldn&apos;t wait to learn to read.",
      date: "September 1, 1965",
      decade: "1960s",
      tags: ["childhood", "school", "milestone"],
      isFavorite: true,
      imageUrl: null,
    },
    {
      id: 3,
      title: "Family Beach Vacation",
      description:
        "The kids built sandcastles all day while we watched the sunset. Such a peaceful week together.",
      date: "July 15, 1990",
      decade: "1990s",
      tags: ["vacation", "beach", "family"],
      isFavorite: false,
      imageUrl: null,
    },
  ];

  const memoryPrompts = [
    "Tell me about your wedding day",
    "What was your favorite childhood memory?",
    "Describe a special family tradition",
    "What was your first job like?",
    "Tell me about when your children were born",
    "What was your favorite place to visit?",
  ];

  const decades = [
    "1930s",
    "1940s",
    "1950s",
    "1960s",
    "1970s",
    "1980s",
    "1990s",
    "2000s",
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Reminisce</h1>
        <p className="text-xl text-gray-600">
          Explore and share your precious memories
        </p>
      </div>

      {/* Memory Prompts Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Heart className="w-6 h-6 mr-3 text-purple-600" />
            Memory Prompts
          </h2>
          <p className="text-gray-600">
            Let these prompts help you remember and share your stories
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memoryPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 text-left justify-start bg-white hover:bg-purple-50 border-purple-200"
              >
                <Play className="w-4 h-4 mr-3 text-purple-600 flex-shrink-0" />
                <span className="text-sm">{prompt}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Browse by Decade */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-blue-600" />
            Browse by Decade
          </h2>
          <p className="text-gray-600">
            Explore memories from different periods of your life
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {decades.map((decade) => (
              <Button
                key={decade}
                variant="outline"
                className="h-16 bg-gradient-to-b from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200"
              >
                <div className="text-center">
                  <div className="font-semibold text-blue-800">{decade}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Featured Memories */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Star className="w-6 h-6 mr-3 text-yellow-500" />
            Featured Memories
          </h2>
          <Button variant="outline">View All Memories</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {featuredMemories.map((memory) => (
            <Card
              key={memory.id}
              className="bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {memory.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{memory.date}</p>
                  </div>
                  {memory.isFavorite && (
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Memory Image Placeholder */}
                <div className="mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg h-32 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">📸 Memory Photo</span>
                </div>

                <p className="text-gray-700 text-sm leading-relaxed mb-4">
                  {memory.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {memory.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Share Story
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Add Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Memory Activity */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-3 text-green-600" />
            Memory Activity
          </h2>
          <p className="text-gray-600">
            See how your family is engaging with memories
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">24</div>
              <p className="text-gray-600">Memories Shared</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">12</div>
              <p className="text-gray-600">Family Comments</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">8</div>
              <p className="text-gray-600">New Photos Added</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-16 bg-purple-600 hover:bg-purple-700">
              <div className="text-center">
                <Heart className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm">Add Memory</div>
              </div>
            </Button>
            <Button variant="outline" className="h-16">
              <div className="text-center">
                <Calendar className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm">Memory Timeline</div>
              </div>
            </Button>
            <Button variant="outline" className="h-16">
              <div className="text-center">
                <Users className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm">Family Stories</div>
              </div>
            </Button>
            <Button variant="outline" className="h-16">
              <div className="text-center">
                <Play className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm">Memory Game</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
