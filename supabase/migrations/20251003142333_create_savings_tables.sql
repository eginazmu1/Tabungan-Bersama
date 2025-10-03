/*
  # Create Savings Tracker Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text, not null) - Display name for the user
      - `created_at` (timestamptz) - When profile was created
    
    - `savings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles) - Who added this saving
      - `amount` (numeric, not null) - Amount saved
      - `description` (text) - Optional description
      - `created_at` (timestamptz) - When saving was added

  2. Security
    - Enable RLS on all tables
    - Authenticated users can read all savings (shared between couple)
    - Users can only insert savings with their own user_id
    - Users can update/delete their own savings only
    - Users can read all profiles
    - Users can only update their own profile
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create savings table
CREATE TABLE IF NOT EXISTS savings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE savings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all savings"
  ON savings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own savings"
  ON savings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings"
  ON savings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings"
  ON savings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_savings_user_id ON savings(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_created_at ON savings(created_at DESC);