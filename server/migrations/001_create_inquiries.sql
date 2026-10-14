-- Migration: 001_create_inquiries.sql
-- Description: Create inquiries table and indexes for SPAN Industrial Solutions
-- Database: PostgreSQL (Neon / Hyperdrive)

CREATE TABLE IF NOT EXISTS inquiries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  company VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  state VARCHAR(100),
  city VARCHAR(100),
  service VARCHAR(100) NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure optional columns and nullable constraints exist if table was previously created
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE inquiries ALTER COLUMN message DROP NOT NULL;

-- Frequent lookup indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
CREATE INDEX IF NOT EXISTS idx_inquiries_service ON inquiries(service);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
