-- CRS Car Park Repairs Database Schema for Neon

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('client', 'admin', 'super_admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sites table
CREATE TABLE IF NOT EXISTS sites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    status VARCHAR(50) DEFAULT 'active',
    last_inspection DATE,
    next_service DATE,
    issues INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Damage reports table
CREATE TABLE IF NOT EXISTS damage_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    site_id INTEGER REFERENCES sites(id),
    description TEXT,
    severity VARCHAR(50),
    photos TEXT[], -- Array of photo URLs
    zones INTEGER DEFAULT 1,
    estimated_cost DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding leads table
CREATE TABLE IF NOT EXISTS onboarding_leads (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    company VARCHAR(255),
    sites_data JSONB,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert super admin user (password: admin123!!)
INSERT INTO users (email, password, name, company, phone, role)
VALUES (
    'mark@leadballoon.co.uk',
    'a1c7e1e5b6c7d1e7b8c5d5e7f7e8d8e9f9e8d7e6f5e4d3e2f1e0d9e8d7e6f5e4',
    'Mark Taylor',
    'Lead Balloon',
    '07700 900000',
    'super_admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert admin user (password: admin123)
INSERT INTO users (email, password, name, company, phone, role)
VALUES (
    'admin@crs.com',
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    'Paul (CRS Admin)',
    'CRS Car Park Repairs',
    '024 7699 2244',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert demo client (password: demo123)
INSERT INTO users (email, password, name, company, phone, role)
VALUES (
    'mcdonalds@franchise.com',
    'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791',
    'John Richardson',
    'McDonald''s Franchise Group',
    '07700 900123',
    'client'
) ON CONFLICT (email) DO NOTHING;

-- Add some demo sites for McDonald's
INSERT INTO sites (user_id, name, address, status, issues)
VALUES 
    (2, 'Birmingham City Centre', 'High Street, B1 2XX', 'critical', 7),
    (2, 'Coventry Ring Road', 'Ring Road, CV1 3XX', 'scheduled', 3),
    (2, 'Solihull Retail Park', 'Retail Park, B91 4XX', 'healthy', 0)
ON CONFLICT DO NOTHING;