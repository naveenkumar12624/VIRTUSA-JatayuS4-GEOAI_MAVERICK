/*
  # Bank Agent Dashboard Schema

  1. New Tables
    - `agents`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `is_online` (boolean, default false)
      - `is_busy` (boolean, default false)
      - `created_at` (timestamp)
    
    - `user_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `message` (text)
      - `timestamp` (timestamp)
      - `from` (enum: 'user', 'ai')
      - `priority_score` (integer, nullable)
      - `escalated` (boolean, default false)
      - `room_name` (text, nullable)
    
    - `escalations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `agent_id` (uuid, foreign key to agents, nullable)
      - `status` (enum: 'waiting', 'connected', 'closed')
      - `reason` (text)
      - `priority_score` (integer, default 5)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for agents to manage escalations
    - Add real-time subscriptions
*/

-- Create message_from enum
CREATE TYPE message_from AS ENUM ('user', 'ai');

-- Create escalation_status enum
CREATE TYPE escalation_status AS ENUM ('waiting', 'connected', 'closed');

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  is_online boolean DEFAULT false,
  is_busy boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create user_messages table
CREATE TABLE IF NOT EXISTS user_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  from_type message_from NOT NULL,
  priority_score integer CHECK (priority_score >= 1 AND priority_score <= 10),
  escalated boolean DEFAULT false,
  room_name text
);

-- Create escalations table
CREATE TABLE IF NOT EXISTS escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  status escalation_status DEFAULT 'waiting',
  reason text NOT NULL,
  priority_score integer DEFAULT 5 CHECK (priority_score >= 1 AND priority_score <= 10),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;

-- Create policies for agents table
CREATE POLICY "Agents can read all agents"
  ON agents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Agents can update own status"
  ON agents
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Agents can insert own data"
  ON agents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for user_messages table
CREATE POLICY "Agents can read all user messages"
  ON user_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own messages"
  ON user_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Agents can update message escalation status"
  ON user_messages
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for escalations table
CREATE POLICY "Agents can read all escalations"
  ON escalations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Agents can update escalations"
  ON escalations
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "System can insert escalations"
  ON escalations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create trigger for updated_at on escalations
CREATE TRIGGER update_escalations_updated_at
  BEFORE UPDATE ON escalations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_messages_user_id ON user_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_escalated ON user_messages(escalated);
CREATE INDEX IF NOT EXISTS idx_user_messages_timestamp ON user_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
CREATE INDEX IF NOT EXISTS idx_escalations_priority ON escalations(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_escalations_created_at ON escalations(created_at DESC);

-- Insert sample agent data
INSERT INTO agents (name, email, is_online) VALUES
  ('Sarah Johnson', 'sarah.johnson@bank.com', true),
  ('Michael Chen', 'michael.chen@bank.com', true),
  ('Emily Rodriguez', 'emily.rodriguez@bank.com', false),
  ('David Kim', 'david.kim@bank.com', true)
ON CONFLICT (email) DO NOTHING;

-- Function to create escalation with room name
CREATE OR REPLACE FUNCTION create_escalation(
  p_user_id uuid,
  p_reason text,
  p_priority_score integer DEFAULT 5
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  escalation_id uuid;
  room_name text;
BEGIN
  -- Generate unique room name
  room_name := 'escalation-' || gen_random_uuid()::text;
  
  -- Insert escalation
  INSERT INTO escalations (user_id, reason, priority_score)
  VALUES (p_user_id, p_reason, p_priority_score)
  RETURNING id INTO escalation_id;
  
  -- Update user messages to mark as escalated and set room name
  UPDATE user_messages 
  SET escalated = true, room_name = room_name
  WHERE user_id = p_user_id 
    AND escalated = false 
    AND timestamp >= NOW() - INTERVAL '1 hour';
  
  RETURN escalation_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_escalation TO authenticated;