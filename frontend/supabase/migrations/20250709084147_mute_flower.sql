/*
  # Create Agent1 Test Account

  1. Test Agent Setup
    - Create agent1@example.com for testing
    - Set as online and available
    
  2. Demo Login Credentials
    - Email: agent1@example.com
    - Password: agent123 (will be set in auth)
*/

-- Ensure agent1 exists in agents table
INSERT INTO agents (name, email, is_online, is_busy) VALUES
  ('Agent One', 'agent1@example.com', true, false)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  is_online = true,
  is_busy = false;

-- Note: The actual auth user will be created when agent1@example.com signs up
-- Use these credentials to test:
-- Email: agent1@example.com  
-- Password: agent123