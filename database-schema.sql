-- CRS Car Park Repair Services Database Schema
-- PostgreSQL Schema

-- Create database
CREATE DATABASE crs_repairs;

-- Use the database
\c crs_repairs;

-- ==========================================
-- CORE TABLES
-- ==========================================

-- Companies/Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255),
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    customer_type VARCHAR(50) DEFAULT 'standard', -- standard, enterprise, franchise
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sites/Locations table
CREATE TABLE sites (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    site_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    postcode VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    site_type VARCHAR(50), -- retail, office, industrial, residential
    parking_spaces INTEGER,
    total_area_sqm DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pothole assessments/quotes
CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    quote_id VARCHAR(20) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    site_id INTEGER REFERENCES sites(id),
    image_url TEXT,
    video_url TEXT,
    ai_analysis JSONB, -- Store AI detection results
    pothole_count INTEGER,
    total_area_sqm DECIMAL(10, 2),
    severity_score INTEGER CHECK (severity_score >= 1 AND severity_score <= 10),
    estimated_cost DECIMAL(10, 2),
    repair_time_hours DECIMAL(5, 2),
    weather_conditions JSONB,
    proximity_discount DECIMAL(5, 2) DEFAULT 0,
    multi_site_discount DECIMAL(5, 2) DEFAULT 0,
    final_quote DECIMAL(10, 2),
    quote_valid_until DATE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, expired
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual potholes detected
CREATE TABLE potholes (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id),
    position_x INTEGER,
    position_y INTEGER,
    width_cm DECIMAL(6, 2),
    length_cm DECIMAL(6, 2),
    depth_cm DECIMAL(5, 2),
    severity VARCHAR(20), -- low, medium, high, critical
    repair_priority INTEGER,
    detected_by VARCHAR(50), -- ai, manual, customer
    confidence_score DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repair jobs
CREATE TABLE repair_jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(20) UNIQUE NOT NULL,
    assessment_id INTEGER REFERENCES assessments(id),
    customer_id INTEGER REFERENCES customers(id),
    site_id INTEGER REFERENCES sites(id),
    scheduled_date DATE,
    scheduled_time TIME,
    crew_id INTEGER,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    materials_used JSONB,
    total_cost DECIMAL(10, 2),
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue
    before_photos TEXT[],
    after_photos TEXT[],
    customer_signature TEXT,
    notes TEXT,
    weather_on_day JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crew/Staff table
CREATE TABLE crew_members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50), -- supervisor, technician, driver
    phone VARCHAR(20),
    email VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crew assignments
CREATE TABLE crew_assignments (
    id SERIAL PRIMARY KEY,
    repair_job_id INTEGER REFERENCES repair_jobs(id),
    crew_member_id INTEGER REFERENCES crew_members(id),
    role VARCHAR(50),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ENTERPRISE FEATURES
-- ==========================================

-- Enterprise accounts
CREATE TABLE enterprise_accounts (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    account_id VARCHAR(20) UNIQUE NOT NULL,
    contract_start DATE,
    contract_end DATE,
    volume_discount DECIMAL(5, 2),
    payment_terms VARCHAR(50), -- net30, net60, immediate
    credit_limit DECIMAL(10, 2),
    account_manager VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Multi-site batches
CREATE TABLE multi_site_batches (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(20) UNIQUE NOT NULL,
    enterprise_account_id INTEGER REFERENCES enterprise_accounts(id),
    total_sites INTEGER,
    total_quote DECIMAL(10, 2),
    batch_discount DECIMAL(5, 2),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batch sites
CREATE TABLE batch_sites (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES multi_site_batches(id),
    site_id INTEGER REFERENCES sites(id),
    assessment_id INTEGER REFERENCES assessments(id),
    priority INTEGER,
    scheduled_date DATE
);

-- ==========================================
-- TRACKING & ANALYTICS
-- ==========================================

-- Job tracking/GPS
CREATE TABLE job_tracking (
    id SERIAL PRIMARY KEY,
    repair_job_id INTEGER REFERENCES repair_jobs(id),
    crew_member_id INTEGER REFERENCES crew_members(id),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(50), -- traveling, arrived, working, completed
    tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer feedback
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    repair_job_id INTEGER REFERENCES repair_jobs(id),
    customer_id INTEGER REFERENCES customers(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    would_recommend BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications log
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    recipient_type VARCHAR(50), -- customer, crew, admin
    recipient_id INTEGER,
    notification_type VARCHAR(50), -- email, sms, push
    subject VARCHAR(255),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- PROXIMITY & ROUTING
-- ==========================================

-- Active routes
CREATE TABLE active_routes (
    id SERIAL PRIMARY KEY,
    route_date DATE NOT NULL,
    crew_id INTEGER,
    total_jobs INTEGER,
    total_distance_km DECIMAL(8, 2),
    estimated_duration_hours DECIMAL(5, 2),
    status VARCHAR(50) DEFAULT 'planned', -- planned, active, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Route stops
CREATE TABLE route_stops (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES active_routes(id),
    repair_job_id INTEGER REFERENCES repair_jobs(id),
    stop_order INTEGER,
    estimated_arrival TIME,
    actual_arrival TIMESTAMP,
    distance_from_previous_km DECIMAL(6, 2)
);

-- Proximity opportunities
CREATE TABLE proximity_opportunities (
    id SERIAL PRIMARY KEY,
    existing_job_id INTEGER REFERENCES repair_jobs(id),
    potential_site_id INTEGER REFERENCES sites(id),
    distance_km DECIMAL(6, 2),
    potential_savings DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'identified', -- identified, contacted, converted, expired
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- ==========================================
-- FINANCIAL & REPORTING
-- ==========================================

-- Invoices
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    repair_job_id INTEGER REFERENCES repair_jobs(id),
    amount DECIMAL(10, 2),
    vat_amount DECIMAL(10, 2),
    total_amount DECIMAL(10, 2),
    due_date DATE,
    paid_date DATE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id),
    amount DECIMAL(10, 2),
    payment_method VARCHAR(50), -- card, bank_transfer, cash, cheque
    transaction_id VARCHAR(100),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX idx_sites_location ON sites(latitude, longitude);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_customer ON assessments(customer_id);
CREATE INDEX idx_repair_jobs_status ON repair_jobs(status);
CREATE INDEX idx_repair_jobs_scheduled ON repair_jobs(scheduled_date);
CREATE INDEX idx_repair_jobs_site ON repair_jobs(site_id);
CREATE INDEX idx_potholes_assessment ON potholes(assessment_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_proximity_status ON proximity_opportunities(status);

-- ==========================================
-- VIEWS FOR REPORTING
-- ==========================================

-- Active jobs view
CREATE VIEW active_jobs_view AS
SELECT 
    rj.*,
    c.company_name,
    c.contact_name,
    s.site_name,
    s.address,
    s.postcode,
    a.pothole_count,
    a.total_area_sqm
FROM repair_jobs rj
JOIN customers c ON rj.customer_id = c.id
JOIN sites s ON rj.site_id = s.id
JOIN assessments a ON rj.assessment_id = a.id
WHERE rj.status IN ('scheduled', 'in_progress');

-- Revenue summary view
CREATE VIEW revenue_summary AS
SELECT 
    DATE_TRUNC('month', rj.completed_at) as month,
    COUNT(*) as jobs_completed,
    SUM(rj.total_cost) as revenue,
    AVG(f.rating) as avg_rating
FROM repair_jobs rj
LEFT JOIN feedback f ON rj.id = f.repair_job_id
WHERE rj.status = 'completed'
GROUP BY DATE_TRUNC('month', rj.completed_at);

-- Proximity savings view
CREATE VIEW proximity_savings_view AS
SELECT 
    po.*,
    s.site_name,
    s.address,
    c.company_name,
    rj.scheduled_date as nearby_job_date
FROM proximity_opportunities po
JOIN sites s ON po.potential_site_id = s.id
LEFT JOIN customers c ON s.customer_id = c.id
JOIN repair_jobs rj ON po.existing_job_id = rj.id
WHERE po.status = 'identified' 
AND po.expires_at > CURRENT_TIMESTAMP;