import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, Users, Play, Star, Plus } from "lucide-react";
import { getMemories, getFamilyMembers } from "@/lib/actions/memories";
import { CreateMemoryModal } from "@/components/create-memory-modal";
import { MemoryCard } from "@/components/memory-card";

export default async function ReminiscePage() {
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

  // Group memories by decade for browsing
  const memoriesByDecade = memories.reduce((acc: any, memory: any) => {
    if (memory.memory_date) {
      const year = new Date(memory.memory_date).getFullYear();
      const decade = `${Math.floor(year / 10) * 10}s`;
      if (!acc[decade]) acc[decade] = [];
      acc[decade].push(memory);
    }
    return acc;
  }, {});

  const favoriteMemories = memories.filter((memory: any) => memory.is_favorite);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header with Add Memory Button */}
      <div className="flex items-center justify-between py-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Reminisce</h1>
          <p className="text-xl text-gray-600">
            Explore and share your precious memories
          </p>
        </div>
        <CreateMemoryModal familyMembers={familyMembers}>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Memory
          </Button>
        </CreateMemoryModal>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memoryPrompts.map((prompt, index) => (
              <CreateMemoryModal
                key={index}
                familyMembers={familyMembers}
                initialTitle={prompt}
              >
                <Button
                  variant="outline"
                  className="h-auto p-4 text-left justify-start bg-white hover:bg-purple-50 border-purple-200 w-full"
                >
                  <Play className="w-4 h-4 mr-3 text-purple-600 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">{prompt}</span>
                </Button>
              </CreateMemoryModal>
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
            {decades.map((decade) => {
              const count = memoriesByDecade[decade]?.length || 0;
              return (
                <Button
                  key={decade}
                  variant="outline"
                  className="h-16 bg-gradient-to-b from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 flex flex-col"
                >
                  <div className="font-semibold text-blue-800">{decade}</div>
                  <div className="text-xs text-blue-600">{count} memories</div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Featured/Favorite Memories */}
      {favoriteMemories.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Star className="w-6 h-6 mr-3 text-yellow-500" />
              Favorite Memories
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {favoriteMemories.slice(0, 6).map((memory: any) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        </div>
      )}

      {/* All Memories */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-3 text-green-600" />
            All Family Memories ({memories.length})
          </h2>
        </div>

        {memories.length === 0 ? (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <Heart className="w-16 h-16 text-gray-300 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-700">
                  No memories yet
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Start preserving your family&apos;s precious memories and
                  stories.
                </p>
                <CreateMemoryModal familyMembers={familyMembers}>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Memory
                  </Button>
                </CreateMemoryModal>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {memories.map((memory: any) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        )}
      </div>

      {/* Memory Activity Stats */}
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
              <div className="text-3xl font-bold text-green-600 mb-2">
                {memories.length}
              </div>
              <p className="text-gray-600">Total Memories</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {favoriteMemories.length}
              </div>
              <p className="text-gray-600">Favorite Memories</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Object.keys(memoriesByDecade).length}
              </div>
              <p className="text-gray-600">Decades Covered</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
