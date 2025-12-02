-- Migration: Migrate existing user data to profiles table
-- Ensures every user has a corresponding profile entry

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- Migrate existing users to profiles table (preserving all existing data)
INSERT OR IGNORE INTO profiles (id, full_name, email, phone_number, aadhar, username)
SELECT 
  u.id,
  COALESCE(u.name, '') as full_name,
  COALESCE(u.email, '') as email,
  COALESCE(u.phone, '') as phone_number,
  COALESCE(u.aadhar, '') as aadhar,
  COALESCE(u.username, '') as username
FROM users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Ensure all users have a profile row (double-check)
INSERT OR IGNORE INTO profiles (id, username, full_name)
SELECT u.id, u.username, COALESCE(u.name, '')
FROM users u
LEFT JOIN profiles pr ON pr.id = u.id
WHERE pr.id IS NULL;

COMMIT;
PRAGMA foreign_keys = ON;
