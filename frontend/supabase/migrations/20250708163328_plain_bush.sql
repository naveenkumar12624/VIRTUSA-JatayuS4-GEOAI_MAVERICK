/*
  # Create 10 Demo Bank Agent Accounts

  1. Demo Agents
    - Create 10 realistic bank agent profiles
    - Set various online/busy statuses for demo
    
  2. Sample Data
    - Add realistic agent names and emails
    - Set different availability statuses
*/

-- Insert 10 demo bank agent accounts
INSERT INTO agents (name, email, is_online, is_busy) VALUES
  ('Sarah Johnson', 'sarah.johnson@bank.com', true, false),
  ('Michael Chen', 'michael.chen@bank.com', true, false),
  ('Emily Rodriguez', 'emily.rodriguez@bank.com', true, true),
  ('David Kim', 'david.kim@bank.com', false, false),
  ('Jessica Williams', 'jessica.williams@bank.com', true, false),
  ('Robert Taylor', 'robert.taylor@bank.com', true, false),
  ('Amanda Davis', 'amanda.davis@bank.com', false, false),
  ('James Wilson', 'james.wilson@bank.com', true, true),
  ('Lisa Anderson', 'lisa.anderson@bank.com', true, false),
  ('Christopher Brown', 'christopher.brown@bank.com', true, false)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  is_online = EXCLUDED.is_online,
  is_busy = EXCLUDED.is_busy;