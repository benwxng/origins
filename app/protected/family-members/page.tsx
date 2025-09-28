import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, User, UserCheck, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { getInitials } from "@/lib/utils/display";
import { AddFamilyMemberModal } from "@/components/add-family-member-modal";
import { DeleteFamilyMemberButton } from "@/components/delete-family-member-button";

interface FamilyMember {
  id: string;
  full_name: string;
  relationship: string;
  user_id: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  phone: string | null;
  pronouns: string | null;
}

export default async function FamilyMembersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Get all family members
  const { data: familyMembers, error } = await supabase
    .from("family_members")
    .select("*")
    .order("full_name");

  if (error) {
    console.error("Error fetching family members:", error);
  }

  const members = familyMembers || [];

  // Separate authenticated users from non-authenticated family members
  const authenticatedUsers = members.filter(member => member.user_id !== null);
  const nonAuthenticatedMembers = members.filter(member => member.user_id === null);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Family Members</h1>
          <p className="text-muted-foreground mt-2">
            Manage all family members and their profiles
          </p>
        </div>
        <div className="flex space-x-2">
          <AddFamilyMemberModal />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authenticated Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authenticatedUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Family Members</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nonAuthenticatedMembers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Authenticated Users Section */}
      {authenticatedUsers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Authenticated Users
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {authenticatedUsers.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/protected/profile/${member.id}`}
                      className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.full_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-foreground font-semibold text-lg">
                            {getInitials(member.full_name)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{member.full_name}</h3>
                      </div>
                    </Link>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      User
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Has account access
                    </span>
                    <Link href={`/protected/profile/${member.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Non-Authenticated Family Members Section */}
      {nonAuthenticatedMembers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Family Members
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nonAuthenticatedMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/protected/profile/${member.id}`}
                      className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.full_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-foreground font-semibold text-lg">
                            {getInitials(member.full_name)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{member.full_name}</h3>
                      </div>
                    </Link>
                    <Badge variant="outline" className="bg-muted">
                      Member
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Family member only
                    </span>
                    <div className="flex space-x-2">
                      <Link href={`/protected/profile/${member.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <DeleteFamilyMemberButton memberId={member.id} memberName={member.full_name} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {members.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Family Members</h3>
            <p className="text-muted-foreground mb-4">
              Start building your family tree by adding family members.
            </p>
            <AddFamilyMemberModal />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
