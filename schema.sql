-- CRS Car Park Repairs Database Schema for Neon

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'client',
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

-- Insert admin user
INSERT INTO users (email, password, name, company, phone, role)
VALUES (
    'admin@crs.com',
    SHA256('admin123'),
    'Admin User',
    'CRS Car Park Repairs',
    '024 7699 2244',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert demo client
INSERT INTO users (email, password, name, company, phone, role)
VALUES (
    'mcdonalds@franchise.com',
    SHA256('demo123'),
    'John Richardson',
    'McDonald''s Franchise Group',
    '07700 900123',
    'client'
) ON CONFLICT (email) DO NOTHING;