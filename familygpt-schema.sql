-- FamilyGPT Database Schema
-- Run this in your Supabase SQL Editor

-- Enable the vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- User-level context table (individual memories, stories, experiences)
CREATE TABLE user_context (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimensions
  source_type TEXT NOT NULL, -- 'post', 'memory', 'profile', 'manual_entry'
  source_id UUID, -- Reference to original post/memory if applicable
  metadata JSONB DEFAULT '{}', -- {"type":"childhood_story","date":"1995-07-03","location":"Ohio","tags":["school","friends"]}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family-level context table (shared experiences, traditions, group memories)
CREATE TABLE family_context (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  raw_text TEXT NOT NULL,
  embedding vector(1536),
  source_type TEXT NOT NULL, -- 'group_memory', 'tradition', 'event', 'compiled_story'
  source_id UUID, -- Reference to original source if applicable
  metadata JSONB DEFAULT '{}', -- {"event":"wedding","date":"2010-08-22","participants":["mom","dad","aunt"],"location":"church"}
  created_by UUID REFERENCES family_members(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced family relationships table (more detailed than existing family_tree_connections)
CREATE TABLE family_relationships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  person_1_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  person_2_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'parent', 'child', 'spouse', 'sibling', 'grandparent', 'grandchild'
  relationship_context TEXT, -- "Margaret's mother", "David's wife", etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(person_1_id, person_2_id, relationship_type)
);

-- Context sources tracking table (what generated each context entry)
CREATE TABLE context_sources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  context_type TEXT NOT NULL, -- 'user_context' or 'family_context'
  context_id UUID NOT NULL, -- References either user_context.id or family_context.id
  source_table TEXT NOT NULL, -- 'family_posts', 'memories', 'family_members' (profile)
  source_record_id UUID NOT NULL, -- ID of the source record
  extraction_method TEXT DEFAULT 'manual', -- 'manual', 'auto_post', 'auto_memory'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat sessions for FamilyGPT
CREATE TABLE familygpt_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  session_name TEXT, -- Optional: "Chat about Grandma's stories"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual messages in FamilyGPT conversations
CREATE TABLE familygpt_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES familygpt_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context_used JSONB DEFAULT '[]', -- Array of context IDs that were used to generate this response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_context_user_id ON user_context(user_id);
CREATE INDEX idx_user_context_family_member ON user_context(family_member_id);
CREATE INDEX idx_user_context_source ON user_context(source_type, source_id);
CREATE INDEX idx_user_context_embedding ON user_context USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX idx_family_context_source ON family_context(source_type, source_id);
CREATE INDEX idx_family_context_embedding ON family_context USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX idx_family_relationships_person1 ON family_relationships(person_1_id);
CREATE INDEX idx_family_relationships_person2 ON family_relationships(person_2_id);

CREATE INDEX idx_familygpt_sessions_user ON familygpt_sessions(user_id);
CREATE INDEX idx_familygpt_messages_session ON familygpt_messages(session_id);

-- RLS Policies (everyone in family can access family context)
ALTER TABLE user_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE familygpt_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE familygpt_messages ENABLE ROW LEVEL SECURITY;

-- Policies for user_context
CREATE POLICY "Users can access all family user context" ON user_context FOR ALL TO authenticated USING (true);

-- Policies for family_context  
CREATE POLICY "Users can access all family context" ON family_context FOR ALL TO authenticated USING (true);

-- Policies for family_relationships
CREATE POLICY "Users can access all family relationships" ON family_relationships FOR ALL TO authenticated USING (true);

-- Policies for FamilyGPT sessions and messages
CREATE POLICY "Users can access their own FamilyGPT sessions" ON familygpt_sessions FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can access messages from their sessions" ON familygpt_messages FOR ALL TO authenticated USING (
  session_id IN (SELECT id FROM familygpt_sessions WHERE user_id = auth.uid())
);

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_context_updated_at BEFORE UPDATE ON user_context FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_family_context_updated_at BEFORE UPDATE ON family_context FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_familygpt_sessions_updated_at BEFORE UPDATE ON familygpt_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 