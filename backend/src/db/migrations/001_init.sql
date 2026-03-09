-- Issue Tracker: Initial Schema
-- Run with: npm run migrate

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('employee', 'supervisor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('open', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Branches
CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Issue Types
CREATE TABLE IF NOT EXISTS issue_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES users(id),
  branch_id INTEGER NOT NULL REFERENCES branches(id),
  issue_type_id INTEGER NOT NULL REFERENCES issue_types(id),
  description TEXT NOT NULL,
  status ticket_status DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Resolutions (1:1 with tickets)
CREATE TABLE IF NOT EXISTS resolutions (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER UNIQUE NOT NULL REFERENCES tickets(id),
  supervisor_id INTEGER NOT NULL REFERENCES users(id),
  remarks TEXT NOT NULL,
  resolved_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tickets_employee_id ON tickets(employee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_branch_id ON tickets(branch_id);
