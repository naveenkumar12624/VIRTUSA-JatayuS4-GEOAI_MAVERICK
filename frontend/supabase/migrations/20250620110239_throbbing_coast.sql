/*
  # Financial App Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text, nullable)
      - `balance` (numeric, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `type` (text: sent, received, expense, loan_payment)
      - `amount` (numeric)
      - `description` (text)
      - `category` (text)
      - `contact_id` (text, nullable)
      - `contact_name` (text, nullable)
      - `status` (text, default 'completed')
      - `created_at` (timestamp)
    
    - `loan_info`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `principal` (numeric)
      - `monthly_interest` (numeric)
      - `total_paid` (numeric, default 0)
      - `remaining_balance` (numeric)
      - `next_payment_date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  balance numeric DEFAULT 45678.50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  type text NOT NULL CHECK (type IN ('sent', 'received', 'expense', 'loan_payment')),
  amount numeric NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  category text NOT NULL,
  contact_id text,
  contact_name text,
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Create loan_info table
CREATE TABLE IF NOT EXISTS loan_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  principal numeric NOT NULL DEFAULT 1500000,
  monthly_interest numeric NOT NULL DEFAULT 25000,
  total_paid numeric DEFAULT 75000,
  remaining_balance numeric NOT NULL DEFAULT 1425000,
  next_payment_date date DEFAULT '2025-01-15',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_info ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for transactions table
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for loan_info table
CREATE POLICY "Users can read own loan info"
  ON loan_info
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loan info"
  ON loan_info
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loan info"
  ON loan_info
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loan_info_updated_at
  BEFORE UPDATE ON loan_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for demo user
DO $$
BEGIN
  -- This will be handled by the application when users sign up
  -- Sample loan info will be created for each user
END $$;