"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  avatar_url?: string;
  is_inferred: boolean;
  generation: number;
  x: number;
  y: number;
}

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
}

export default function SimpleFamilyTree() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isMounted, setIsMounted] = useState(false);

  // Constants for layout
  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 120;
  const HORIZONTAL_SPACING = 250;
  const VERTICAL_SPACING = 200;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load family tree data
  useEffect(() => {
    async function loadFamilyTree() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.log("No user found");
          setIsLoading(false);
          return;
        }

        console.log("Loading family tree for user:", user.id);

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", user.id)
          .single();

        console.log("User profile:", profile);
        setCurrentUserProfile(profile);

        // Get current user's family member ID
        const { data: userMember } = await supabase
          .from("family_members")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!userMember) {
          console.log("No family member record found for user");
          setIsLoading(false);
          return;
        }

        console.log("User family member ID:", userMember.id);

        // Get all direct parent-child relationships
        const { data: relationships } = await supabase
          .from("family_relationships")
          .select(`
            *,
            parent:family_members!family_relationships_person_a_id_fkey(
              id, full_name, avatar_url, user_id
            ),
            child:family_members!family_relationships_person_b_id_fkey(
              id, full_name, avatar_url, user_id
            )
          `)
          .eq("relationship_type", "parent")
          .eq("is_inferred", false);

        console.log("Direct relationships:", relationships);

        if (!relationships || relationships.length === 0) {
          console.log("No relationships found");
          setIsLoading(false);
          return;
        }

        // Get all family members for reference
        const { data: allFamilyMembers } = await supabase
          .from("family_members")
          .select("id, full_name, avatar_url, user_id");

        if (!allFamilyMembers) {
          console.log("No family members found");
          setIsLoading(false);
          return;
        }

        // Build family tree structure
        const members: FamilyMember[] = [];
        const processedIds = new Set<string>();

        // Find all relationships involving the current user
        const userRelationships = relationships.filter(rel => 
          rel.person_a_id === userMember.id || rel.person_b_id === userMember.id
        );

        console.log("User relationships:", userRelationships);

        // Process each relationship
        userRelationships.forEach((rel, index) => {
          let relatedMember = null;
          let relationshipType = "";
          let generation = 0;

          if (rel.person_a_id === userMember.id) {
            // Current user is the parent, related person is child
            relatedMember = rel.child;
            relationshipType = "child";
            generation = 1;
          } else if (rel.person_b_id === userMember.id) {
            // Current user is the child, related person is parent
            relatedMember = rel.parent;
            relationshipType = "parent";
            generation = -1;
          }

          if (relatedMember && !processedIds.has(relatedMember.id)) {
            members.push({
              id: relatedMember.id,
              name: relatedMember.full_name || "Unknown",
              relationship: relationshipType,
              avatar_url: relatedMember.avatar_url,
              is_inferred: false,
              generation,
              x: 0, // Will be calculated based on generation
              y: 0, // Will be calculated based on generation
            });
            processedIds.add(relatedMember.id);
          }
        });

        // Now find siblings (people who share parents with current user)
        const userParents = relationships
          .filter(rel => rel.person_b_id === userMember.id)
          .map(rel => rel.person_a_id);

        console.log("User parents:", userParents);

        // Find siblings
        userParents.forEach(parentId => {
          const siblings = relationships
            .filter(rel => rel.person_a_id === parentId && rel.person_b_id !== userMember.id)
            .map(rel => rel.child);

          siblings.forEach((sibling, index) => {
            if (!processedIds.has(sibling.id)) {
              members.push({
                id: sibling.id,
                name: sibling.full_name || "Unknown",
                relationship: "sibling",
                avatar_url: sibling.avatar_url,
                is_inferred: true,
                generation: 0,
                x: 0,
                y: 0,
              });
              processedIds.add(sibling.id);
            }
          });
        });

        // Calculate positions for each generation
        const membersByGeneration = members.reduce((acc, member) => {
          if (!acc[member.generation]) {
            acc[member.generation] = [];
          }
          acc[member.generation].push(member);
          return acc;
        }, {} as { [key: number]: FamilyMember[] });

        console.log("Members by generation:", membersByGeneration);

        // Position members in each generation
        const positionedMembers: FamilyMember[] = [];
        Object.keys(membersByGeneration).forEach(generationStr => {
          const generation = parseInt(generationStr);
          const generationMembers = membersByGeneration[generation];
          
          generationMembers.forEach((member, index) => {
            const y = generation * (NODE_HEIGHT + VERTICAL_SPACING);
            const x = (index - (generationMembers.length - 1) / 2) * (NODE_WIDTH + HORIZONTAL_SPACING);
            
            positionedMembers.push({
              ...member,
              x,
              y,
            });
          });
        });

        console.log("Final positioned members:", positionedMembers);
        setFamilyMembers(positionedMembers);

      } catch (error) {
        console.error("Error loading family tree:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadFamilyTree();
  }, []);

  // Handle mouse events for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX - pan.x;
    const startY = e.clientY - pan.y;

    const handleMouseMove = (e: MouseEvent) => {
      setPan({
        x: e.clientX - startX,
        y: e.clientY - startY,
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handle wheel events for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(3, prev * delta)));
  };

  // Render connection lines
  const renderConnections = () => {
    if (!currentUserProfile) return null;

    const connections = familyMembers.map((member) => {
      // Simple vertical connections for now
      const startX = 0 + NODE_WIDTH / 2;
      const startY = 0 + NODE_HEIGHT;
      const endX = member.x + NODE_WIDTH / 2;
      const endY = member.y;

      return (
        <line
          key={`connection-${member.id}`}
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={member.is_inferred ? "hsl(var(--muted-foreground))" : "hsl(var(--primary))"}
          strokeWidth={member.is_inferred ? 1 : 2}
          strokeDasharray={member.is_inferred ? "5,5" : "0"}
        />
      );
    });

    return connections;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading family tree...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-background">
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">Family Tree</h1>
        <p className="text-muted-foreground">
          Pan: Click and drag | Zoom: Mouse wheel | Scroll: Mouse wheel (when not zooming)
        </p>
      </div>
      
      <div
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        <svg
          width="100%"
          height="100%"
          style={{
            transform: isMounted 
              ? `translate(${pan.x + window.innerWidth / 2}px, ${pan.y + window.innerHeight / 2}px) scale(${zoom})`
              : `translate(${pan.x + 600}px, ${pan.y + 400}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Render connection lines */}
          {renderConnections()}

          {/* Current user node (center) */}
          {currentUserProfile && (
            <g>
              <rect
                x={0}
                y={0}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx="8"
                fill="hsl(var(--card))"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
              />
              <circle
                cx={NODE_WIDTH / 2}
                cy={35}
                r={18}
                fill="hsl(var(--muted))"
              />
              {currentUserProfile.avatar_url ? (
                <image
                  href={currentUserProfile.avatar_url}
                  x={NODE_WIDTH / 2 - 18}
                  y={17}
                  width={36}
                  height={36}
                  clipPath="url(#avatarClip)"
                />
              ) : (
                <text
                  x={NODE_WIDTH / 2}
                  y={40}
                  textAnchor="middle"
                  className="text-sm font-medium fill-foreground"
                >
                  {currentUserProfile.full_name?.charAt(0) || "U"}
                </text>
              )}
              <text
                x={NODE_WIDTH / 2}
                y={70}
                textAnchor="middle"
                className="text-sm font-medium fill-foreground"
              >
                {currentUserProfile.full_name || "You"}
              </text>
              <text
                x={NODE_WIDTH / 2}
                y={90}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
              >
                You
              </text>
            </g>
          )}

          {/* Family member nodes */}
          {familyMembers.map((member) => (
            <g key={member.id}>
              <rect
                x={member.x}
                y={member.y}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx="8"
                fill="hsl(var(--card))"
                stroke={member.is_inferred ? "hsl(var(--muted-foreground))" : "hsl(var(--border))"}
                strokeWidth="2"
                strokeDasharray={member.is_inferred ? "5,5" : "0"}
              />
              <circle
                cx={member.x + NODE_WIDTH / 2}
                cy={member.y + 35}
                r={18}
                fill="hsl(var(--muted))"
              />
              {member.avatar_url ? (
                <image
                  href={member.avatar_url}
                  x={member.x + NODE_WIDTH / 2 - 18}
                  y={member.y + 17}
                  width={36}
                  height={36}
                  clipPath="url(#avatarClip)"
                />
              ) : (
                <text
                  x={member.x + NODE_WIDTH / 2}
                  y={member.y + 40}
                  textAnchor="middle"
                  className="text-sm font-medium fill-foreground"
                >
                  {member.name.charAt(0)}
                </text>
              )}
              <text
                x={member.x + NODE_WIDTH / 2}
                y={member.y + 70}
                textAnchor="middle"
                className="text-sm font-medium fill-foreground"
              >
                {member.name}
              </text>
              <text
                x={member.x + NODE_WIDTH / 2}
                y={member.y + 90}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
              >
                {member.relationship}
                {member.is_inferred && " (inferred)"}
              </text>
            </g>
          ))}

          {/* Avatar clip path */}
          <defs>
            <clipPath id="avatarClip">
              <circle cx="0" cy="0" r="18" />
            </clipPath>
          </defs>
        </svg>
      </div>
    </div>
  );
}
