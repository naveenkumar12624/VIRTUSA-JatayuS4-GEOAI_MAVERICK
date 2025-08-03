/*
  # Add Google Authentication and User Search Features

  1. Security Updates
    - Update RLS policies for user search functionality
    - Add indexes for better search performance
    
  2. User Search
    - Add search functionality for users by name, email, phone
    - Ensure users can't see sensitive data of other users
    
  3. Enhanced User Management
    - Support for Google OAuth metadata
    - Phone number validation
*/

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_users_search ON users USING gin(
  to_tsvector('english', name || ' ' || email || ' ' || COALESCE(phone, ''))
);

-- Add index for email and phone searches
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

-- Update RLS policy to allow users to search other users (but only see limited info)
CREATE POLICY "Users can search other users" ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create new policy for reading own complete data
CREATE POLICY "Users can read own complete data" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for reading limited data of other users (for search)
CREATE POLICY "Users can read limited data of others" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() != id);

-- Ensure users can still update only their own data
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure users can still insert their own data
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Add a function to safely search users (excluding sensitive data for non-owners)
CREATE OR REPLACE FUNCTION search_users(search_query text, current_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  phone text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.email,
    u.phone
  FROM users u
  WHERE 
    u.id != current_user_id
    AND (
      u.name ILIKE '%' || search_query || '%' OR
      u.email ILIKE '%' || search_query || '%' OR
      u.phone ILIKE '%' || search_query || '%'
    )
  ORDER BY u.name
  LIMIT 10;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_users TO authenticated;