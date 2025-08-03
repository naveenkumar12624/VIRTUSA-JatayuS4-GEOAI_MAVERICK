/*
  # Add WebRTC signaling support

  1. New Tables
    - `webrtc_signaling` - Store WebRTC signaling messages
      - `id` (uuid, primary key)
      - `room_name` (text)
      - `from_user` (text)
      - `to_user` (text, nullable)
      - `message_type` (text) - offer, answer, ice-candidate, join, leave
      - `message_data` (jsonb)
      - `created_at` (timestamp)

  2. Indexes
    - Index on room_name for efficient querying
    - Index on created_at for cleanup

  3. Security
    - Enable RLS on webrtc_signaling table
    - Add policies for authenticated users to manage their signaling messages
*/

-- Create WebRTC signaling table
CREATE TABLE IF NOT EXISTS webrtc_signaling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name text NOT NULL,
  from_user text NOT NULL,
  to_user text,
  message_type text NOT NULL CHECK (message_type IN ('offer', 'answer', 'ice-candidate', 'join', 'leave', 'ready')),
  message_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_room_name ON webrtc_signaling(room_name);
CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_created_at ON webrtc_signaling(created_at);
CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_from_user ON webrtc_signaling(from_user);

-- Enable RLS
ALTER TABLE webrtc_signaling ENABLE ROW LEVEL SECURITY;

-- Create policies for WebRTC signaling
CREATE POLICY "Users can insert signaling messages"
  ON webrtc_signaling
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read signaling messages in their rooms"
  ON webrtc_signaling
  FOR SELECT
  TO authenticated
  USING (
    from_user = auth.uid()::text OR 
    to_user = auth.uid()::text OR
    to_user IS NULL
  );

-- Add cleanup function for old signaling messages (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_signaling_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM webrtc_signaling 
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Add room_name column to escalations table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'escalations' AND column_name = 'room_name'
  ) THEN
    ALTER TABLE escalations ADD COLUMN room_name text;
  END IF;
END $$;

-- Add call_duration column to voice_call_requests if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voice_call_requests' AND column_name = 'call_duration'
  ) THEN
    ALTER TABLE voice_call_requests ADD COLUMN call_duration integer DEFAULT 0;
  END IF;
END $$;

-- Add ended_at column to voice_call_requests if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voice_call_requests' AND column_name = 'ended_at'
  ) THEN
    ALTER TABLE voice_call_requests ADD COLUMN ended_at timestamptz;
  END IF;
END $$;

-- Update voice_call_requests status check to include new statuses
ALTER TABLE voice_call_requests DROP CONSTRAINT IF EXISTS voice_call_requests_status_check;
ALTER TABLE voice_call_requests ADD CONSTRAINT voice_call_requests_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'completed'::text, 'cancelled'::text, 'timeout'::text]));