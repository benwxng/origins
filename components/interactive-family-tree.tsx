"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, User } from "lucide-react";
import { getInitials } from "@/lib/utils/display";
import { formatRelationshipType, getGenderSpecificRelationship } from "@/lib/utils/relationships";
import Link from "next/link";

interface FamilyMember {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  relationship_type?: string;
  is_inferred?: boolean;
  x: number;
  y: number;
  generation: number;
  pronouns?: string; // Added pronouns for gender-specific relationships
}

interface InteractiveFamilyTreeProps {
  currentUserId: string;
  relationships: any[];
  currentUserProfile: any;
}

export function InteractiveFamilyTree({
  currentUserId,
  relationships,
  currentUserProfile,
}: InteractiveFamilyTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 100 }); // Start with Y offset to show parents above
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Layout configuration
  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 140;
  const HORIZONTAL_SPACING = 200; // Much larger spacing
  const VERTICAL_SPACING = 250; // Much larger spacing

  // Set mounted state after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Process relationships into positioned family members
  useEffect(() => {
    console.log("Processing relationships:", relationships);
    console.log("Current user profile:", currentUserProfile);
    console.log("Current user avatar_url:", currentUserProfile?.avatar_url);
    console.log("Total relationships to process:", relationships.length);
    
    // Debug: Log each relationship type
    relationships.forEach((rel, index) => {
      console.log(`Relationship ${index}:`, {
        type: rel.relationship_type,
        person_a_id: rel.person_a_id,
        person_b_id: rel.person_b_id,
        person_b_name: rel.person_b?.full_name,
        is_inferred: rel.is_inferred
      });
    });
    
    const members: FamilyMember[] = [];
    const processedIds = new Set<string>();

    // Find the current user's family member ID from the relationships
    // The current user should appear as person_a in some relationships
    let currentUserFamilyMemberId = null;
    for (const rel of relationships) {
      if (rel.person_a && rel.person_a.user_id === currentUserId) {
        currentUserFamilyMemberId = rel.person_a.id;
        break;
      }
    }
    
    console.log("Current user ID:", currentUserId);
    console.log("Current user family member ID found:", currentUserFamilyMemberId);
    
    // If not found in person_a, check person_b
    if (!currentUserFamilyMemberId) {
      for (const rel of relationships) {
        if (rel.person_b && rel.person_b.user_id === currentUserId) {
          currentUserFamilyMemberId = rel.person_b.id;
          break;
        }
      }
      console.log("Current user family member ID found in person_b:", currentUserFamilyMemberId);
    }
    
    // Debug: Check for parent relationships specifically
    const parentRels = relationships.filter(rel => 
      rel.relationship_type === 'parent' || 
      (rel.person_a_id === currentUserFamilyMemberId && rel.relationship_type === 'child')
    );
    console.log("Parent relationships found:", parentRels.length);
    console.log("Parent relationships details:", parentRels);

    // Add current user at center
    const currentUser: FamilyMember = {
      id: currentUserId,
      full_name: currentUserProfile?.full_name || "You",
      username:
        currentUserProfile?.full_name?.toLowerCase().replace(/\s+/g, "") ||
        "you",
      avatar_url: currentUserProfile?.avatar_url || null,
      x: 0,
      y: 0,
      generation: 0,
    };
    console.log("Current user object:", currentUser);
    console.log("Current user family member ID:", currentUserFamilyMemberId);
    members.push(currentUser);
    processedIds.add(currentUserId);

    // Process direct relationships
    relationships.forEach((rel: any, index: number) => {
      console.log("Processing relationship:", rel);
      console.log("Relationship type:", rel.relationship_type);
      console.log("Person A ID:", rel.person_a_id);
      console.log("Person B ID:", rel.person_b_id);
      console.log("Current user family member ID:", currentUserFamilyMemberId);
      console.log("Person B avatar_url:", rel.person_b?.avatar_url); // Debug avatar URLs
      if (!processedIds.has(rel.person_b.id)) {
        // Determine the display relationship based on the direction
        // With new structure: person_a_id = parent, person_b_id = child
        let displayRelationship;
        if (rel.person_a_id === currentUserFamilyMemberId) {
          // Current user is person_a (parent), so from their perspective it's "child"
          displayRelationship = getReverseRelationshipForDisplay(rel.relationship_type);
          console.log(`Current user is person_a (parent). Original: ${rel.relationship_type}, Display: ${displayRelationship}`);
        } else {
          // Current user is person_b (child), so from their perspective it's "parent"
          displayRelationship = rel.relationship_type;
          console.log(`Current user is person_b (child). Using relationship as-is: ${displayRelationship}`);
        }
        
        const generation = getGeneration(displayRelationship);
        const position = getPosition(displayRelationship, index, generation);
        
        console.log(`Generation calculation: ${displayRelationship} -> generation ${generation}`);

        console.log("Adding family member:", {
          id: rel.person_b.id,
          name: rel.person_b.full_name,
          relationship: rel.relationship_type,
          displayRelationship: displayRelationship, // Debug this value
          avatar_url: rel.person_b.avatar_url, // Debug this value
          generation,
          position,
          index,
        });

        members.push({
          id: rel.person_b.id,
          full_name: rel.person_b.full_name,
          username:
            rel.person_b.username ||
            rel.person_b.full_name.toLowerCase().replace(/\s+/g, ""),
          avatar_url: rel.person_b.avatar_url, // This should have the Supabase URL
          relationship_type: displayRelationship, // Use the display relationship
          is_inferred: rel.is_inferred,
          x: position.x,
          y: position.y,
          generation,
          pronouns: rel.person_b.pronouns, // Add pronouns for gender-specific relationships
        });

        processedIds.add(rel.person_b.id);
      }
    });

    console.log("Final family members array:", members);
    console.log(
      "Final family members DETAILED:",
      JSON.stringify(members, null, 2)
    );
    setFamilyMembers(members);
  }, [relationships, currentUserProfile, currentUserId]);

  // Helper function to get the reverse relationship for display
  const getReverseRelationshipForDisplay = (
    relationshipType: string
  ): string => {
    const reverseMap: { [key: string]: string } = {
      child: "parent", // If I am their child → they are my parent
      parent: "child", // If I am their parent → they are my child
      sibling: "sibling", // If I am their sibling → they are my sibling
      spouse: "spouse", // If I am their spouse → they are my spouse
      grandchild: "grandparent", // If I am their grandchild → they are my grandparent
      grandparent: "grandchild", // If I am their grandparent → they are my grandchild
    };

    return reverseMap[relationshipType] || relationshipType;
  };

  const getGeneration = (relationshipType: string): number => {
    switch (relationshipType) {
      case "grandparent":
      case "great_aunt_uncle":
        return -2;
      case "parent":
      case "aunt_uncle":
      case "parent_in_law":
        return -1;
      case "sibling":
      case "cousin":
      case "spouse":
      case "sibling_in_law":
        return 0;
      case "child":
      case "niece_nephew":
      case "child_in_law":
        return 1;
      case "grandchild":
      case "great_niece_nephew":
        return 2;
      default:
        return 0;
    }
  };

  const getPosition = (
    relationshipType: string,
    index: number,
    generation: number
  ) => {
    // Simple grid positioning - just place everyone in a grid
    const y = generation * (NODE_HEIGHT + VERTICAL_SPACING);
    
    // For now, just spread them horizontally based on their index
    // Use a much larger spacing to avoid overlap
    const x = (index - 1) * (NODE_WIDTH + HORIZONTAL_SPACING * 3);
    
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const renderConnections = () => {
    const connections: JSX.Element[] = [];

    familyMembers.forEach((member) => {
      if (member.id === currentUserId) return;

      // Draw line from current user to this member
      const currentUserNode = familyMembers.find((m) => m.id === currentUserId);
      if (!currentUserNode) return;

      // Calculate connection points from edge to edge to avoid cutting through boxes
      let startX, startY, endX, endY;
      
      // Determine which edge of the current user's box to connect from
      if (member.x > currentUserNode.x) {
        // Member is to the right, connect from right edge of current user
        startX = currentUserNode.x + NODE_WIDTH;
        startY = currentUserNode.y + NODE_HEIGHT / 2;
        endX = member.x;
        endY = member.y + NODE_HEIGHT / 2;
      } else if (member.x < currentUserNode.x) {
        // Member is to the left, connect from left edge of current user
        startX = currentUserNode.x;
        startY = currentUserNode.y + NODE_HEIGHT / 2;
        endX = member.x + NODE_WIDTH;
        endY = member.y + NODE_HEIGHT / 2;
      } else {
        // Member is above or below, connect from top/bottom edge
        if (member.y < currentUserNode.y) {
          // Member is above
          startX = currentUserNode.x + NODE_WIDTH / 2;
          startY = currentUserNode.y;
          endX = member.x + NODE_WIDTH / 2;
          endY = member.y + NODE_HEIGHT;
        } else {
          // Member is below
          startX = currentUserNode.x + NODE_WIDTH / 2;
          startY = currentUserNode.y + NODE_HEIGHT;
          endX = member.x + NODE_WIDTH / 2;
          endY = member.y;
        }
      }

      connections.push(
        <line
          key={`connection-${member.id}`}
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={member.is_inferred ? "hsl(var(--muted-foreground))" : "hsl(var(--primary))"}
          strokeWidth={member.is_inferred ? 1 : 2}
          strokeDasharray={member.is_inferred ? "5,5" : "none"}
        />
      );
    });

    return connections;
  };

  return (
    <div className="w-full h-screen relative bg-background overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 right-4 z-10">
        <Card className="p-3 bg-card/90 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">
            Click and drag to navigate • Scroll to zoom
          </p>
        </Card>
      </div>

      {/* Tree Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
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
          {/* Connection lines */}
          <g>{renderConnections()}</g>

          {/* Family member nodes */}
          {familyMembers.map((member) => {
            console.log(
              `Rendering member: ${member.full_name} at (${member.x}, ${member.y})`
            );
            return (
              <g key={member.id}>
                {/* Node background */}
                <rect
                  x={member.x}
                  y={member.y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={8}
                  fill={member.id === currentUserId ? "hsl(var(--primary) / 0.1)" : "hsl(var(--card))"}
                  stroke={member.id === currentUserId ? "hsl(var(--primary))" : "hsl(var(--border))"}
                  strokeWidth={member.id === currentUserId ? 2 : 1}
                  className="drop-shadow-sm"
                />

                {/* Profile picture */}
                <circle
                  cx={member.x + NODE_WIDTH / 2}
                  cy={member.y + 25}
                  r={16}
                  fill="hsl(var(--muted))"
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                />

                {member.avatar_url ? (
                  <>
                    {/* Circular mask for profile picture */}
                    <defs>
                      <clipPath id={`clip-${member.id}`}>
                        <circle
                          cx={member.x + NODE_WIDTH / 2}
                          cy={member.y + 25}
                          r={15}
                        />
                      </clipPath>
                    </defs>
                    <image
                      x={member.x + NODE_WIDTH / 2 - 15}
                      y={member.y + 10}
                      width={30}
                      height={30}
                      href={member.avatar_url}
                      clipPath={`url(#clip-${member.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </>
                ) : (
                  <text
                    x={member.x + NODE_WIDTH / 2}
                    y={member.y + 30}
                    textAnchor="middle"
                    className="fill-muted-foreground text-xs font-semibold"
                  >
                    {getInitials(member.full_name)}
                  </text>
                )}

                {/* Name */}
                <text
                  x={member.x + NODE_WIDTH / 2}
                  y={member.y + 60}
                  textAnchor="middle"
                  className="fill-foreground text-sm font-semibold"
                >
                  {member.full_name.length > 20
                    ? member.full_name.substring(0, 17) + "..."
                    : member.full_name}
                </text>

                {/* Relationship */}
                {member.relationship_type && (
                  <text
                    x={member.x + NODE_WIDTH / 2}
                    y={member.y + 78}
                    textAnchor="middle"
                    className={`text-xs ${
                      member.is_inferred ? "fill-muted-foreground" : "fill-primary"
                    }`}
                  >
                    {getGenderSpecificRelationship(member.relationship_type || "", member.pronouns)}
                    {member.is_inferred && " (inferred)"}
                  </text>
                )}

                {/* Current user indicator */}
                {member.id === currentUserId && (
                  <text
                    x={member.x + NODE_WIDTH / 2}
                    y={member.y + 95}
                    textAnchor="middle"
                    className="fill-primary text-xs font-bold"
                  >
                    You
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="p-3 bg-card/90 backdrop-blur-sm">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-primary"></div>
              <span>Direct relationship</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-muted-foreground border-dashed border-t"></div>
              <span>Inferred relationship</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
