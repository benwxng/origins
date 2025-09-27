import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, MapPin, Phone, Mail, Calendar, Users, Plus } from "lucide-react";
import Link from "next/link";
import { getInitials } from "@/lib/utils/display";
import { getUserRelationships, getRelationshipBetweenUsers } from "@/lib/actions/relationships";
import { formatRelationshipType } from "@/lib/utils/relationships";
import { AddRelationshipDropdown } from "@/components/add-relationship-dropdown";

interface ProfileViewPageProps {
  params: {
    userId: string;
  };
}

export default async function ProfileViewPage({ params }: ProfileViewPageProps) {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return redirect("/auth/login");
  }

  // Fetch the profile data for the requested user
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.userId)
    .single();

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">The profile you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link href="/protected">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Family Feed
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get user data for additional info
  const { data: userData } = await supabase.auth.admin.getUserById(params.userId);

  const isOwnProfile = currentUser.id === params.userId;

  // Get relationships for this user
  const relationships = await getUserRelationships(params.userId);
  
  // Get the relationship between current user and viewed user (if not own profile)
  let currentUserRelationship = null;
  if (!isOwnProfile) {
    currentUserRelationship = await getRelationshipBetweenUsers(currentUser.id, params.userId);
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/protected">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Family Feed
          </Button>
        </Link>
        {isOwnProfile && (
          <Link href="/protected/profile">
            <Button>Edit Profile</Button>
          </Link>
        )}
      </div>

      {/* Profile Header */}
      <Card className="bg-white shadow-sm mb-6">
        <CardHeader className="text-center pb-4">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <span className="text-gray-600 font-semibold text-2xl">
                {getInitials(profile.full_name || "User")}
              </span>
            )}
          </div>
          <CardTitle className="text-2xl text-gray-900">
            {profile.full_name || "No name provided"}
          </CardTitle>
          <p className="text-gray-700 text-lg">
            @{profile.username || "no-username"}
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            {currentUserRelationship && (
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                Your {formatRelationshipType(currentUserRelationship.relationship_type)}
                {currentUserRelationship.is_inferred && " (inferred)"}
              </Badge>
            )}
          </div>
          
          {/* Add Relationship Dropdown */}
          {!isOwnProfile && !currentUserRelationship && (
            <div className="mt-4 max-w-sm mx-auto">
              <AddRelationshipDropdown currentUserId={currentUser.id} />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Relationships Section */}
      {relationships.length > 0 && (
        <Card className="bg-white shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Family Relationships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relationships.map((rel: any) => (
                <Link
                  key={rel.id}
                  href={`/protected/profile/${rel.person_b.id}`}
                  className="block"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {rel.person_b.avatar_url ? (
                        <img
                          src={rel.person_b.avatar_url}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-semibold text-sm">
                          {getInitials(rel.person_b.full_name)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {rel.person_b.full_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {formatRelationshipType(rel.relationship_type)}
                        </Badge>
                        {rel.is_inferred && (
                          <span className="text-xs text-gray-500">inferred</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.pronouns && (
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Pronouns</p>
                  <p className="font-medium text-gray-900">{profile.pronouns}</p>
                </div>
              </div>
            )}
            
            {profile.location && (
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium text-gray-900">{profile.location}</p>
                </div>
              </div>
            )}

            {profile.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{profile.phone}</p>
                </div>
              </div>
            )}

            {userData?.user?.email && (
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{userData.user.email}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Member since</p>
                <p className="font-medium text-gray-900">
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">About</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.bio ? (
              <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
            ) : (
              <p className="text-gray-500 italic">No bio provided yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
