-- Migration: Add email column to users table
-- This allows email-based authentication alongside username

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- Add email column to users table
ALTER TABLE users ADD COLUMN email TEXT;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

COMMIT;
PRAGMA foreign_keys = ON;
