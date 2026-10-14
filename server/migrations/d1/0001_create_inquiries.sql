-- Migration: 0001_create_inquiries.sql
-- Description: Create inquiries table and indexes for Cloudflare D1 (SQLite)
-- Database: Cloudflare D1 (SQLite)

CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  state TEXT,
  city TEXT,
  service TEXT NOT NULL,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
CREATE INDEX IF NOT EXISTS idx_inquiries_service ON inquiries(service);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
