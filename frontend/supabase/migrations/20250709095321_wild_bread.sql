/*
  # Create voice_call_requests table

  1. New Tables
    - `voice_call_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `agent_id` (uuid, foreign key to agents)
      - `room_name` (text, unique room identifier)
      - `status` (text, call status: pending, active, completed, cancelled)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `voice_call_requests` table
    - Add policies for users to create requests and agents to manage them

  3. Indexes
    - Index on user_id for fast user lookups
    - Index on agent_id for agent dashboard queries
    - Index on status for filtering active calls
*/

CREATE TABLE IF NOT EXISTS voice_call_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  room_name text NOT NULL UNIQUE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE voice_call_requests ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_call_requests_user_id ON voice_call_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_requests_agent_id ON voice_call_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_requests_status ON voice_call_requests(status);
CREATE INDEX IF NOT EXISTS idx_voice_call_requests_created_at ON voice_call_requests(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_voice_call_requests_updated_at
  BEFORE UPDATE ON voice_call_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
CREATE POLICY "Users can create own voice call requests"
  ON voice_call_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own voice call requests"
  ON voice_call_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Agents can read all voice call requests"
  ON voice_call_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.id = auth.uid() OR agents.email = auth.email()
    )
  );

CREATE POLICY "Agents can update voice call requests"
  ON voice_call_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.id = auth.uid() OR agents.email = auth.email()
    )
  );

CREATE POLICY "System can update voice call requests"
  ON voice_call_requests
  FOR UPDATE
  TO authenticated
  USING (true);