-- Users table for authentication and roles
CREATE TABLE IF NOT EXISTS users (
  email VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user', -- 'user' or 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster role queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE users IS 'Stores user accounts with email and role-based access';
COMMENT ON COLUMN users.role IS 'User role: user (default) or admin (for admin panel access)';
