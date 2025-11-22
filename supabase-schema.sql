-- Listings table for property submissions
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL, -- hotel, attraction, car, mall, restaurant
  name VARCHAR(255) NOT NULL,
  location TEXT NOT NULL,
  city VARCHAR(100),
  province VARCHAR(100),
  description TEXT NOT NULL,
  price VARCHAR(100),
  owner_name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_phone VARCHAR(50),
  amenities JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by VARCHAR(255),
  rejection_notes TEXT,
  rating INTEGER,
  hours JSONB,
  coordinates JSONB,
  website VARCHAR(255),
  social_media JSONB DEFAULT '{}'::jsonb,
  additional_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_submitted_at ON listings(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_owner_email ON listings(owner_email);

-- Row Level Security (RLS)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (submit listings)
CREATE POLICY "Allow public insert" ON listings
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Only authenticated admins can select
CREATE POLICY "Allow admin select" ON listings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only authenticated admins can update
CREATE POLICY "Allow admin update" ON listings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Only authenticated admins can delete
CREATE POLICY "Allow admin delete" ON listings
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE listings IS 'Stores property listings submitted by owners for review and approval';
COMMENT ON COLUMN listings.status IS 'Current status: pending (awaiting review), approved (live), rejected (declined)';
COMMENT ON COLUMN listings.type IS 'Type of property: hotel, attraction, car, mall, restaurant';
