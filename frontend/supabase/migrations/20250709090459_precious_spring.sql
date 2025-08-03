/*
  # Ensure Agent1 Account Exists

  1. Agent Account
    - Ensure agent1@example.com exists in agents table
    - Set proper status for testing
    
  2. Authentication
    - The auth user must be created separately through Supabase Auth
*/

-- Ensure agent1 exists in agents table with correct status
INSERT INTO agents (name, email, is_online, is_busy) VALUES
  ('Agent One', 'agent1@example.com', true, false)
ON CONFLICT (email) DO UPDATE SET
  name = 'Agent One',
  is_online = true,
  is_busy = false;

-- Verify the agent exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM agents WHERE email = 'agent1@example.com') THEN
    RAISE EXCEPTION 'Agent1 account was not created successfully';
  END IF;
  
  RAISE NOTICE 'Agent1 account verified in agents table';
END $$;