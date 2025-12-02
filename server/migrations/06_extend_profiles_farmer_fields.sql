-- Migration: Extend profiles table with farmer-specific fields
-- Adds 4 new columns for farmer marketplace data and populates existing rows with mock data

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- Check and add crops_grown column if it doesn't exist
-- Note: SQLite doesn't have IF NOT EXISTS for ALTER COLUMN, so we handle this carefully
-- We'll use a safe approach by checking the schema first through the migration runner

ALTER TABLE profiles ADD COLUMN crops_grown TEXT;
ALTER TABLE profiles ADD COLUMN available_quantity TEXT;
ALTER TABLE profiles ADD COLUMN location TEXT;
ALTER TABLE profiles ADD COLUMN expected_price TEXT;

-- Populate existing farmer profiles with mock data
-- This updates ONLY existing rows, does NOT create new rows

-- Profile ID 1 (Devanshu Singh)
UPDATE profiles SET 
  crops_grown = 'Tomato, Onion',
  available_quantity = '1200 kg',
  location = 'Nashik, Maharashtra',
  expected_price = '₹30–₹45/kg'
WHERE id = 1 AND crops_grown IS NULL;

-- Profile ID 2 (Vishesh)
UPDATE profiles SET 
  crops_grown = 'Wheat, Barley',
  available_quantity = '2500 kg',
  location = 'Akola, Maharashtra',
  expected_price = '₹22–₹30/kg'
WHERE id = 2 AND crops_grown IS NULL;

-- Profile ID 3 (Test Farmer)
UPDATE profiles SET 
  crops_grown = 'Sugarcane, Cotton',
  available_quantity = '5000 kg',
  location = 'Pune, Maharashtra',
  expected_price = '₹280–₹300/quintal'
WHERE id = 3 AND crops_grown IS NULL;

-- If there are more farmer profiles, add more UPDATE statements following this pattern:
-- Additional mock data patterns:
-- - Orange, Soybean | 2000 kg | Nagpur, Maharashtra | ₹40–₹60/kg
-- - Maize, Jowar | 1600 kg | Kolhapur, Maharashtra | ₹18–₹22/kg
-- - Grapes | 800 kg | Sangli, Maharashtra | ₹50–₹70/kg

COMMIT;
PRAGMA foreign_keys = ON;
