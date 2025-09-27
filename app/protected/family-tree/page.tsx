import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Heart } from "lucide-react";

export default async function FamilyTreePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Placeholder family members data - will be replaced with real data later
  const familyMembers = [
    {
      id: 1,
      name: "Eleanor Thompson",
      relationship: "Grandmother",
      birthYear: "1935",
      isElder: true,
      generation: 1,
    },
    {
      id: 2,
      name: "Robert Thompson",
      relationship: "Grandfather",
      birthYear: "1932",
      isElder: true,
      generation: 1,
    },
    {
      id: 3,
      name: "Margaret Johnson",
      relationship: "Mother",
      birthYear: "1960",
      isElder: false,
      generation: 2,
    },
    {
      id: 4,
      name: "David Johnson",
      relationship: "Father",
      birthYear: "1958",
      isElder: false,
      generation: 2,
    },
    {
      id: 5,
      name: "Sarah Johnson",
      relationship: "Daughter",
      birthYear: "1985",
      isElder: false,
      generation: 3,
    },
    {
      id: 6,
      name: "Michael Johnson",
      relationship: "Son",
      birthYear: "1988",
      isElder: false,
      generation: 3,
    },
    {
      id: 7,
      name: "Emily Johnson",
      relationship: "Daughter",
      birthYear: "1992",
      isElder: false,
      generation: 3,
    },
  ];

  const generations = [
    {
      level: 1,
      title: "Grandparents",
      members: familyMembers.filter((m) => m.generation === 1),
    },
    {
      level: 2,
      title: "Parents",
      members: familyMembers.filter((m) => m.generation === 2),
    },
    {
      level: 3,
      title: "Children",
      members: familyMembers.filter((m) => m.generation === 3),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Family Tree</h1>
        <p className="text-gray-600">
          Explore your family connections and relationships
        </p>
      </div>

      {/* Add Family Member Button */}
      <div className="flex justify-center mb-8">
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Family Member
        </Button>
      </div>

      {/* Family Tree Visualization */}
      <div className="space-y-8">
        {generations.map((generation) => (
          <div key={generation.level} className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {generation.title}
            </h2>

            {/* Connection lines placeholder */}
            {generation.level > 1 && (
              <div className="flex justify-center mb-4">
                <div className="w-px h-8 bg-gray-300"></div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-6">
              {generation.members.map((member) => (
                <Card
                  key={member.id}
                  className="w-64 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardHeader className="text-center pb-3">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-3">
                      {member.isElder ? (
                        <Heart className="w-8 h-8 text-purple-600" />
                      ) : (
                        <Users className="w-8 h-8 text-blue-600" />
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      {member.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {member.relationship}
                    </p>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">
                        Born {member.birthYear}
                      </p>
                      {member.isElder && (
                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          Elder
                        </span>
                      )}
                    </div>
                    <div className="mt-4 space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        View Profile
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-gray-500"
                      >
                        Add Memory
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Connection lines between generations */}
            {generation.level < 3 && (
              <div className="flex justify-center mt-6">
                <div className="w-px h-8 bg-gray-300"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tree Stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 mt-12">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {familyMembers.length}
              </h3>
              <p className="text-gray-600">Family Members</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {generations.length}
              </h3>
              <p className="text-gray-600">Generations</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {familyMembers.filter((m) => m.isElder).length}
              </h3>
              <p className="text-gray-600">Elders</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Tree Placeholder */}
      <Card className="bg-gray-50">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <Users className="w-16 h-16 text-gray-400 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-700">
              Interactive Family Tree
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              A visual family tree diagram will be displayed here, showing
              connections and relationships between family members.
            </p>
            <Button variant="outline">View Interactive Tree</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
