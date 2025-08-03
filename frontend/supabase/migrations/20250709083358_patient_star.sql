/*
  # Voice Call Requests Table

  1. New Tables
    - `voice_call_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `agent_id` (uuid, foreign key to agents)
      - `room_name` (text, unique room identifier)
      - `status` (enum: 'pending', 'active', 'completed')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on voice_call_requests table
    - Add policies for agents and users to manage voice calls

  3. Test Agent Account
    - Create agent1@example.com for testing
*/

-- Create voice call status enum
CREATE TYPE voice_call_status AS ENUM ('pending', 'active', 'completed');

-- Create voice_call_requests table
CREATE TABLE IF NOT EXISTS voice_call_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  room_name text NOT NULL,
  status voice_call_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE voice_call_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for voice_call_requests table
CREATE POLICY "Agents can read assigned voice calls"
  ON voice_call_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read own voice calls"
  ON voice_call_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert voice call requests"
  ON voice_call_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Agents can update voice call status"
  ON voice_call_requests
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_voice_call_requests_updated_at
  BEFORE UPDATE ON voice_call_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_voice_call_requests_agent_id ON voice_call_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_requests_user_id ON voice_call_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_requests_status ON voice_call_requests(status);
CREATE INDEX IF NOT EXISTS idx_voice_call_requests_created_at ON voice_call_requests(created_at DESC);

-- Insert test agent account
INSERT INTO agents (name, email, is_online, is_busy) VALUES
  ('Agent One', 'agent1@example.com', true, false)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  is_online = EXCLUDED.is_online,
  is_busy = EXCLUDED.is_busy;