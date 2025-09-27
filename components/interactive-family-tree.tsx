"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, User } from "lucide-react";
import { getInitials } from "@/lib/utils/display";
import { formatRelationshipType } from "@/lib/utils/relationships";
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
}

interface InteractiveFamilyTreeProps {
  currentUserId: string;
  relationships: any[];
  currentUserProfile: any;
}

export function InteractiveFamilyTree({ currentUserId, relationships, currentUserProfile }: InteractiveFamilyTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Layout configuration
  const NODE_WIDTH = 180;
  const NODE_HEIGHT = 120;
  const HORIZONTAL_SPACING = 60;
  const VERTICAL_SPACING = 80;

  // Process relationships into positioned family members
  useEffect(() => {
    console.log("Processing relationships:", relationships);
    console.log("Current user profile:", currentUserProfile);
    
    const members: FamilyMember[] = [];
    const processedIds = new Set<string>();

    // Add current user at center
    const currentUser: FamilyMember = {
      id: currentUserId,
      full_name: currentUserProfile?.full_name || "You",
      username: currentUserProfile?.username || "you",
      avatar_url: currentUserProfile?.avatar_url || null,
      x: 0,
      y: 0,
      generation: 0,
    };
    members.push(currentUser);
    processedIds.add(currentUserId);

    // Process direct relationships
    relationships.forEach((rel: any, index: number) => {
      console.log("Processing relationship:", rel);
      if (!processedIds.has(rel.person_b.id)) {
        const generation = getGeneration(rel.relationship_type);
        const position = getPosition(rel.relationship_type, index, generation);
        
        console.log("Adding family member:", {
          id: rel.person_b.id,
          name: rel.person_b.full_name,
          relationship: rel.relationship_type,
          generation,
          position
        });
        
        members.push({
          id: rel.person_b.id,
          full_name: rel.person_b.full_name,
          username: rel.person_b.username,
          avatar_url: rel.person_b.avatar_url,
          relationship_type: rel.relationship_type,
          is_inferred: rel.is_inferred,
          x: position.x,
          y: position.y,
          generation,
        });
        processedIds.add(rel.person_b.id);
      }
    });

    console.log("Final family members:", members);
    setFamilyMembers(members);
  }, [relationships, currentUserId, currentUserProfile]);

  const getGeneration = (relationshipType: string): number => {
    switch (relationshipType) {
      case 'grandparent':
      case 'great_aunt_uncle':
        return -2;
      case 'parent':
      case 'aunt_uncle':
      case 'parent_in_law':
        return -1;
      case 'sibling':
      case 'cousin':
      case 'spouse':
      case 'sibling_in_law':
        return 0;
      case 'child':
      case 'niece_nephew':
      case 'child_in_law':
        return 1;
      case 'grandchild':
      case 'great_niece_nephew':
        return 2;
      default:
        return 0;
    }
  };

  const getPosition = (relationshipType: string, index: number, generation: number) => {
    const y = generation * (NODE_HEIGHT + VERTICAL_SPACING);
    
    // For same generation (0), we need to position them to the side of the current user
    if (generation === 0) {
      const sameGenerationRels = relationships.filter(r => getGeneration(r.relationship_type) === 0);
      const currentIndex = sameGenerationRels.findIndex(r => r.relationship_type === relationshipType);
      const totalSameGen = sameGenerationRels.length;
      
      // Position them symmetrically around the current user
      // If we have 1 person: position to the right
      // If we have 2+ people: spread them out on both sides
      if (totalSameGen === 1) {
        const x = NODE_WIDTH + HORIZONTAL_SPACING;
        return { x, y };
      } else {
        // Spread them out symmetrically
        const startX = -((totalSameGen - 1) * (NODE_WIDTH + HORIZONTAL_SPACING)) / 2;
        const x = startX + currentIndex * (NODE_WIDTH + HORIZONTAL_SPACING);
        // Offset to avoid overlapping with current user at x=0
        const offsetX = x >= 0 ? x + NODE_WIDTH + HORIZONTAL_SPACING : x;
        return { x: offsetX, y };
      }
    }
    
    // For other generations, center them horizontally
    const sameGeneration = relationships.filter(r => getGeneration(r.relationship_type) === generation);
    const positionInGeneration = sameGeneration.findIndex(r => r.relationship_type === relationshipType);
    const totalInGeneration = sameGeneration.length;
    
    // Center the generation horizontally
    const startX = -((totalInGeneration - 1) * (NODE_WIDTH + HORIZONTAL_SPACING)) / 2;
    const x = startX + positionInGeneration * (NODE_WIDTH + HORIZONTAL_SPACING);
    
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const renderConnections = () => {
    const connections: JSX.Element[] = [];
    
    familyMembers.forEach((member) => {
      if (member.id === currentUserId) return;
      
      // Draw line from current user to this member
      const currentUserNode = familyMembers.find(m => m.id === currentUserId);
      if (!currentUserNode) return;

      const startX = currentUserNode.x + NODE_WIDTH / 2;
      const startY = currentUserNode.y + NODE_HEIGHT / 2;
      const endX = member.x + NODE_WIDTH / 2;
      const endY = member.y + NODE_HEIGHT / 2;

      connections.push(
        <line
          key={`connection-${member.id}`}
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={member.is_inferred ? "#94a3b8" : "#3b82f6"}
          strokeWidth={member.is_inferred ? 1 : 2}
          strokeDasharray={member.is_inferred ? "5,5" : "none"}
        />
      );
    });

    return connections;
  };

  return (
    <div className="w-full h-screen relative bg-gray-50 overflow-hidden">
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
        <Card className="p-3 bg-white/90 backdrop-blur-sm">
          <p className="text-sm text-gray-600">Click and drag to navigate • Scroll to zoom</p>
        </Card>
      </div>

      {/* Tree Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <svg
          width="100%"
          height="100%"
          style={{
            transform: `translate(${pan.x + window.innerWidth / 2}px, ${pan.y + window.innerHeight / 2}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Connection lines */}
          <g>{renderConnections()}</g>
          
          {/* Family member nodes */}
          {familyMembers.map((member) => (
            <g key={member.id}>
              {/* Node background */}
              <rect
                x={member.x}
                y={member.y}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx={8}
                fill={member.id === currentUserId ? "#dbeafe" : "white"}
                stroke={member.id === currentUserId ? "#3b82f6" : "#e5e7eb"}
                strokeWidth={member.id === currentUserId ? 2 : 1}
                className="drop-shadow-sm"
              />
              
              {/* Profile picture */}
              <circle
                cx={member.x + NODE_WIDTH / 2}
                cy={member.y + 25}
                r={16}
                fill="#f3f4f6"
                stroke="#e5e7eb"
                strokeWidth={1}
              />
              
              {member.avatar_url ? (
                <image
                  x={member.x + NODE_WIDTH / 2 - 16}
                  y={member.y + 9}
                  width={32}
                  height={32}
                  href={member.avatar_url}
                  clipPath="circle(16px at center)"
                />
              ) : (
                <text
                  x={member.x + NODE_WIDTH / 2}
                  y={member.y + 30}
                  textAnchor="middle"
                  className="fill-gray-600 text-xs font-semibold"
                >
                  {getInitials(member.full_name)}
                </text>
              )}
              
              {/* Name */}
              <text
                x={member.x + NODE_WIDTH / 2}
                y={member.y + 60}
                textAnchor="middle"
                className="fill-gray-900 text-sm font-semibold"
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
                  className={`text-xs ${member.is_inferred ? 'fill-gray-500' : 'fill-blue-600'}`}
                >
                  {formatRelationshipType(member.relationship_type)}
                  {member.is_inferred && " (inferred)"}
                </text>
              )}
              
              {/* Current user indicator */}
              {member.id === currentUserId && (
                <text
                  x={member.x + NODE_WIDTH / 2}
                  y={member.y + 95}
                  textAnchor="middle"
                  className="fill-blue-600 text-xs font-medium"
                >
                  You
                </text>
              )}
              
              {/* Click area for navigation */}
              <rect
                x={member.x}
                y={member.y}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                fill="transparent"
                className="cursor-pointer hover:fill-black hover:fill-opacity-5"
                onClick={(e) => {
                  e.stopPropagation();
                  if (member.id !== currentUserId) {
                    window.location.href = `/protected/profile/${member.id}`;
                  }
                }}
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="p-3 bg-white/90 backdrop-blur-sm">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-600"></div>
              <span>Direct relationship</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-gray-400 border-dashed border-t"></div>
              <span>Inferred relationship</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
