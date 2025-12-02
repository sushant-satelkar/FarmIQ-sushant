-- Migration: Create profiles table
-- Creates a 1-to-1 relationship with users table where profiles.id = users.id

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone_number TEXT,
  aadhar TEXT,
  username TEXT,
  village TEXT,
  district TEXT,
  state TEXT,
  language_pref TEXT DEFAULT 'en',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index on email for searches
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);

COMMIT;
PRAGMA foreign_keys = ON;
