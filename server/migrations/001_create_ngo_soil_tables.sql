PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS ngo_schemes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  ministry TEXT,
  deadline TEXT,
  location TEXT,
  contact_number TEXT,
  no_of_docs_required INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  benefit_text TEXT,
  eligibility_text TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ngo_name ON ngo_schemes(name);
CREATE INDEX IF NOT EXISTS idx_ngo_status ON ngo_schemes(status);

CREATE TABLE IF NOT EXISTS soil_lab (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT,
  contact_number TEXT,
  price REAL,
  rating REAL,
  tag TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_soil_name ON soil_lab(name);
CREATE INDEX IF NOT EXISTS idx_soil_location ON soil_lab(location);

COMMIT;
PRAGMA foreign_keys = ON;
