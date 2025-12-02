-- Destructive migration: Reset profiles and users schema
-- Removes: username, aadhar (from users & profiles), village, district, state (from profiles), name (from users)
-- WARNING: This will DELETE ALL PROFILE DATA

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- 1) Drop profiles table completely (deletes all profile data)
DROP TABLE IF EXISTS profiles;

-- 2) Create new profiles table with minimal fields only
CREATE TABLE profiles (
  id INTEGER PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone_number TEXT,
  language_pref TEXT DEFAULT 'en',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3) Rebuild users table WITHOUT username, aadhar, and name columns
-- SQLite requires table rebuild to drop columns

-- 3.a Create new users table with desired columns only
CREATE TABLE users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'farmer',
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 3.b Copy data from current users -> users_new (excluding username, aadhar, name, is_active)
INSERT INTO users_new (id, email, password_hash, role, phone, created_at, updated_at)
SELECT 
  id,
  COALESCE(email, username, 'user' || id || '@example.com') AS email,  -- fallback if email is null
  password_hash,
  COALESCE(role, 'farmer') AS role,
  COALESCE(phone, '') AS phone,
  COALESCE(created_at, datetime('now')) AS created_at,
  COALESCE(updated_at, datetime('now')) AS updated_at
FROM users;

-- 3.c Drop old users table and rename new one
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- 4) Create empty profile for each user (so profile page doesn't error)
INSERT INTO profiles (id, full_name, email, phone_number, created_at, updated_at)
SELECT 
  id, 
  '' AS full_name,  -- empty, user will fill it in
  email, 
  phone, 
  datetime('now'),
  datetime('now')
FROM users;

COMMIT;
PRAGMA foreign_keys = ON;
