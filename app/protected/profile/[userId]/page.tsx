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
import { EditFamilyMemberModal } from "@/components/edit-family-member-modal";
import { ParentAssignmentDropdown } from "@/components/parent-assignment-dropdown";
import { ParentRelationshipsDisplay } from "@/components/parent-relationships-display";

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

  console.log("ProfileViewPage - Requested userId:", params.userId);
  console.log("ProfileViewPage - Current user ID:", currentUser.id);

  // First, try to get the family member data using the ID
  const { data: familyMember, error: familyMemberError } = await supabase
    .from("family_members")
    .select("*")
    .eq("id", params.userId)
    .single();

  console.log("Family member query result:", familyMember);
  console.log("Family member query error:", familyMemberError);

  let profile = null;
  let error = null;

  // If this family member has a user_id, try to get their profile
  if (familyMember && familyMember.user_id) {
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", familyMember.user_id)
      .single();
    
    profile = userProfile;
    error = profileError;
    console.log("Profile query result:", profile);
    console.log("Profile query error:", error);
  }

  // If profile doesn't exist, use family member data
  let userInfo = null;
  if ((error || !profile) && familyMember) {
    console.log("Profile not found, using family member data");
    userInfo = {
      id: familyMember.user_id || params.userId, // Use user_id if available, otherwise use family member ID
      full_name: familyMember.full_name || "Family Member",
      username: familyMember.full_name?.toLowerCase().replace(/\s+/g, "") || "family-member",
      avatar_url: familyMember.avatar_url,
      bio: null,
      location: null,
      phone_number: null,
      pronouns: null,
    };
    console.log("Created userInfo from family_members:", userInfo);
  }

  if (!familyMember) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">The profile you're looking for doesn't exist or you don't have permission to view it.</p>
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

  // Use profile if available, otherwise use userInfo
  const displayProfile = profile || userInfo;

  // Get user data for additional info (only if this is an authenticated user)
  let userData = null;
  if (familyMember && familyMember.user_id) {
    const { data: userDataResult } = await supabase.auth.admin.getUserById(familyMember.user_id);
    userData = userDataResult;
  }

  const isOwnProfile = familyMember && familyMember.user_id === currentUser.id;

  // Get relationships for this family member
  let relationships = [];
  if (familyMember.user_id) {
    // If this family member has a user_id, get their relationships
    console.log("Getting relationships for authenticated user:", familyMember.user_id);
    relationships = await getUserRelationships(familyMember.user_id);
    console.log("Relationships for authenticated user:", relationships);
  } else {
    // If no user_id, get relationships using the family member ID directly
    console.log("Getting relationships for non-authenticated family member:", familyMember.id);
    const supabase = await createClient();
    const { data: familyRelationships, error: relationshipsError } = await supabase
      .from("family_relationships")
      .select(`
        *,
        related_person:family_members!family_relationships_related_person_id_fkey(
          id, full_name, relationship, avatar_url, user_id
        )
      `)
      .eq("person_id", familyMember.id);
    
    console.log("Family relationships query result:", familyRelationships);
    console.log("Family relationships query error:", relationshipsError);
    relationships = familyRelationships || [];
  }
  
  console.log("Final relationships array:", relationships);
  
  // Get the relationship between current user and viewed user (if not own profile)
  let currentUserRelationship = null;
  if (!isOwnProfile && familyMember.user_id) {
    currentUserRelationship = await getRelationshipBetweenUsers(currentUser.id, familyMember.user_id);
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
        <div className="flex space-x-2">
          {isOwnProfile && (
            <Link href="/protected/profile">
              <Button>Edit Profile</Button>
            </Link>
          )}
          {!isOwnProfile && !familyMember.user_id && (
            <EditFamilyMemberModal 
              memberId={familyMember.id}
              currentData={{
                full_name: familyMember.full_name,
                bio: familyMember.bio,
                phone_number: familyMember.phone_number,
                pronouns: familyMember.pronouns,
              }}
            />
          )}
        </div>
      </div>

      {/* Profile Header */}
      <Card className="bg-card shadow-sm border-border mb-6">
        <CardHeader className="text-center pb-4">
          <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            {displayProfile.avatar_url ? (
              <img
                src={displayProfile.avatar_url}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <span className="text-muted-foreground font-semibold text-2xl">
                {getInitials(displayProfile.full_name || "User")}
              </span>
            )}
          </div>
          <CardTitle className="text-2xl text-card-foreground">
            {displayProfile.full_name || "No name provided"}
          </CardTitle>
          <p className="text-muted-foreground text-lg">
            @{displayProfile.username || "no-username"}
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            {currentUserRelationship && (
              <Badge variant="outline" className="border-primary/20 text-primary">
                Your {formatRelationshipType(currentUserRelationship.relationship_type)}
                {currentUserRelationship.is_inferred && " (inferred)"}
              </Badge>
            )}
          </div>
          
        </CardHeader>
      </Card>


      {/* Parent Relationships */}
      <ParentRelationshipsDisplay 
        familyMemberId={familyMember.id} 
        isOwnProfile={isOwnProfile}
        canEdit={!familyMember.user_id}
      />

      {/* Profile Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayProfile.pronouns && (
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Pronouns</p>
                  <p className="font-medium text-card-foreground">{displayProfile.pronouns}</p>
                </div>
              </div>
            )}
            
            {displayProfile.location && (
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium text-card-foreground">{displayProfile.location}</p>
                </div>
              </div>
            )}

            {displayProfile.phone_number && (
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-card-foreground">{displayProfile.phone_number}</p>
                </div>
              </div>
            )}

            {userData?.user?.email && (
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-card-foreground">{userData.user.email}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Member since</p>
                <p className="font-medium text-card-foreground">
                  {new Date(displayProfile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">About</CardTitle>
          </CardHeader>
          <CardContent>
            {displayProfile.bio ? (
              <p className="text-foreground leading-relaxed">{displayProfile.bio}</p>
            ) : (
              <p className="text-muted-foreground italic">No bio provided yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
