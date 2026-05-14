-- ==========================================
-- EVENTHUB - NEW SUPABASE SQL SCHEMA SETUP
-- (Matches the Next.js JSON Database structure)
-- ==========================================

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  password TEXT,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'EventsManager')),
  phone_number TEXT,
  has_completed_setup BOOLEAN DEFAULT FALSE,
  security_pin TEXT,
  security_question TEXT,
  security_answer TEXT
);

-- 2. Events Table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  secret_key TEXT NOT NULL,
  registration_status TEXT NOT NULL CHECK (registration_status IN ('Open', 'Closed')),
  admin_id TEXT REFERENCES admins(id) ON DELETE SET NULL,
  start_date TEXT,
  end_date TEXT,
  start_time TEXT,
  end_time TEXT,
  venue TEXT,
  address TEXT,
  contact_info TEXT,
  registration_start_date TEXT,
  registration_start_time TEXT,
  registration_end_date TEXT,
  registration_end_time TEXT,
  departments JSONB DEFAULT '[]'::jsonb,
  event_type TEXT CHECK (event_type IN ('Free', 'Paid')),
  event_fee NUMERIC,
  upi_id TEXT,
  payee_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users Table (Passes/Registrations)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unique_id TEXT NOT NULL,
  standard TEXT,
  department TEXT,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('Paid', 'Unpaid', 'Pending', 'Refunded', 'Refund In Progress')),
  event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
  email TEXT,
  email_or_phone TEXT,
  phone_number TEXT,
  whatsapp_number TEXT,
  entered BOOLEAN DEFAULT FALSE,
  entry_time TEXT,
  exit_time TEXT,
  transaction_id TEXT,
  screenshot_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Entry Logs Table
CREATE TABLE IF NOT EXISTS entry_logs (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  unique_id TEXT NOT NULL,
  entry_time TEXT NOT NULL,
  exit_time TEXT,
  event_id TEXT REFERENCES events(id) ON DELETE CASCADE
);

-- 5. Refund Requests Table
CREATE TABLE IF NOT EXISTS refund_requests (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  pass_id TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email_or_phone TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  upi_id_or_account TEXT NOT NULL,
  payment_date TEXT NOT NULL,
  amount_paid NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Paid', 'Under Review')),
  requested_at TEXT NOT NULL,
  approved_at TEXT,
  paid_at TEXT,
  rejection_reason TEXT,
  refund_charge NUMERIC,
  final_refund_amount NUMERIC,
  agreed_to_terms BOOLEAN DEFAULT TRUE,
  screenshot_path TEXT,
  event_admin_id TEXT REFERENCES admins(id) ON DELETE SET NULL
);

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('EVENT', 'USER', 'ADMIN', 'REFUND')),
  entity_id TEXT NOT NULL,
  admin_id TEXT REFERENCES admins(id) ON DELETE SET NULL,
  timestamp TEXT NOT NULL,
  details TEXT NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- For simplicity, since the app relies on admin login, 
-- we can allow anonymous access for reads/writes via the service key or anon key
-- but ideally you would protect these using Supabase Auth.
-- To allow the current Next.js app to work as-is, we will disable RLS 
-- or enable it with true policies.

ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE entry_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Optional Default Admin
INSERT INTO admins (id, name, password, role) 
VALUES ('akashbirsone80@gmail.com', 'Super Admin', '2324000721', 'Admin') 
ON CONFLICT (id) DO NOTHING;
