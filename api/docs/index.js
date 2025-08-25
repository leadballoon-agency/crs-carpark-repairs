import { Pool } from '@neondatabase/serverless';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    
    try {
        // Create tables if they don't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS documentation (
                id SERIAL PRIMARY KEY,
                slug VARCHAR(255) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                content TEXT,
                meta JSONB,
                status VARCHAR(50) DEFAULT 'published',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS documentation_versions (
                id SERIAL PRIMARY KEY,
                doc_id INTEGER REFERENCES documentation(id) ON DELETE CASCADE,
                version INTEGER NOT NULL,
                title VARCHAR(255),
                content TEXT,
                changed_by INTEGER,
                change_note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        if (req.method === 'GET') {
            const { slug, category, all } = req.query;
            
            if (slug) {
                // Get specific document
                const result = await pool.query(
                    'SELECT * FROM documentation WHERE slug = $1 AND status = $2',
                    [slug, 'published']
                );
                
                if (result.rows.length > 0) {
                    // Get version history
                    const versions = await pool.query(
                        'SELECT * FROM documentation_versions WHERE doc_id = $1 ORDER BY version DESC LIMIT 10',
                        [result.rows[0].id]
                    );
                    
                    return res.status(200).json({ 
                        doc: result.rows[0],
                        versions: versions.rows
                    });
                }
                
                return res.status(404).json({ error: 'Document not found' });
            }
            
            if (category) {
                // Get documents by category
                const result = await pool.query(
                    'SELECT id, slug, title, category, meta FROM documentation WHERE category = $1 AND status = $2 ORDER BY title',
                    [category, 'published']
                );
                
                return res.status(200).json({ docs: result.rows });
            }
            
            if (all === 'true') {
                // Get all documents (admin)
                const token = req.headers.authorization?.replace('Bearer ', '');
                if (!token) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                
                // Verify admin
                const sessionResult = await pool.query(
                    `SELECT u.role FROM sessions s 
                     JOIN users u ON s.user_id = u.id 
                     WHERE s.token = $1 AND s.expires_at > NOW()`,
                    [token]
                );
                
                if (sessionResult.rows.length === 0 || 
                    (sessionResult.rows[0].role !== 'admin' && sessionResult.rows[0].role !== 'super_admin')) {
                    return res.status(403).json({ error: 'Admin access required' });
                }
                
                const result = await pool.query(
                    'SELECT * FROM documentation ORDER BY category, title'
                );
                
                return res.status(200).json({ docs: result.rows });
            }
            
            // Get all published documents grouped by category
            const result = await pool.query(
                'SELECT id, slug, title, category FROM documentation WHERE status = $1 ORDER BY category, title',
                ['published']
            );
            
            // Group by category
            const grouped = {};
            result.rows.forEach(doc => {
                if (!grouped[doc.category]) {
                    grouped[doc.category] = [];
                }
                grouped[doc.category].push(doc);
            });
            
            return res.status(200).json({ docs: grouped });
        }
        
        if (req.method === 'POST') {
            // Create new document (admin only)
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            // Verify admin
            const sessionResult = await pool.query(
                `SELECT s.user_id, u.role FROM sessions s 
                 JOIN users u ON s.user_id = u.id 
                 WHERE s.token = $1 AND s.expires_at > NOW()`,
                [token]
            );
            
            if (sessionResult.rows.length === 0 || 
                (sessionResult.rows[0].role !== 'admin' && sessionResult.rows[0].role !== 'super_admin')) {
                return res.status(403).json({ error: 'Admin access required' });
            }
            
            const userId = sessionResult.rows[0].user_id;
            const { slug, title, category, content, meta } = req.body;
            
            // Create document
            const result = await pool.query(
                `INSERT INTO documentation (slug, title, category, content, meta) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [slug, title, category, content, JSON.stringify(meta || {})]
            );
            
            // Create initial version
            await pool.query(
                `INSERT INTO documentation_versions (doc_id, version, title, content, changed_by, change_note)
                 VALUES ($1, 1, $2, $3, $4, 'Initial version')`,
                [result.rows[0].id, title, content, userId]
            );
            
            return res.status(201).json({ doc: result.rows[0] });
        }
        
        if (req.method === 'PUT') {
            // Update document (admin only)
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            // Verify admin
            const sessionResult = await pool.query(
                `SELECT s.user_id, u.role FROM sessions s 
                 JOIN users u ON s.user_id = u.id 
                 WHERE s.token = $1 AND s.expires_at > NOW()`,
                [token]
            );
            
            if (sessionResult.rows.length === 0 || 
                (sessionResult.rows[0].role !== 'admin' && sessionResult.rows[0].role !== 'super_admin')) {
                return res.status(403).json({ error: 'Admin access required' });
            }
            
            const userId = sessionResult.rows[0].user_id;
            const { id, title, content, category, meta, status, changeNote } = req.body;
            
            // Get current version
            const currentDoc = await pool.query('SELECT * FROM documentation WHERE id = $1', [id]);
            if (currentDoc.rows.length === 0) {
                return res.status(404).json({ error: 'Document not found' });
            }
            
            // Get latest version number
            const versionResult = await pool.query(
                'SELECT MAX(version) as max_version FROM documentation_versions WHERE doc_id = $1',
                [id]
            );
            const nextVersion = (versionResult.rows[0].max_version || 0) + 1;
            
            // Save to version history
            await pool.query(
                `INSERT INTO documentation_versions (doc_id, version, title, content, changed_by, change_note)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [id, nextVersion, currentDoc.rows[0].title, currentDoc.rows[0].content, userId, changeNote || 'Updated']
            );
            
            // Update document
            const result = await pool.query(
                `UPDATE documentation 
                 SET title = $2, content = $3, category = $4, meta = $5, status = $6, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1 RETURNING *`,
                [id, title, content, category, JSON.stringify(meta || {}), status || 'published']
            );
            
            return res.status(200).json({ doc: result.rows[0], version: nextVersion });
        }
        
        if (req.method === 'DELETE') {
            // Delete document (super admin only)
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            // Verify super admin
            const sessionResult = await pool.query(
                `SELECT u.role FROM sessions s 
                 JOIN users u ON s.user_id = u.id 
                 WHERE s.token = $1 AND s.expires_at > NOW()`,
                [token]
            );
            
            if (sessionResult.rows.length === 0 || sessionResult.rows[0].role !== 'super_admin') {
                return res.status(403).json({ error: 'Super admin access required' });
            }
            
            const { id } = req.query;
            
            // Soft delete by setting status
            await pool.query(
                'UPDATE documentation SET status = $2 WHERE id = $1',
                [id, 'deleted']
            );
            
            return res.status(200).json({ success: true });
        }
        
    } catch (error) {
        console.error('Database error:', error);
        
        // Return fallback documentation if database fails
        if (req.method === 'GET') {
            const fallbackDocs = {
                'getting-started': {
                    'welcome': { title: 'Welcome to CRS', content: 'Welcome content...' },
                    'quick-start': { title: 'Quick Start Guide', content: 'Get started...' }
                },
                'client-portal': {
                    'overview': { title: 'Portal Overview', content: 'Portal features...' }
                }
            };
            return res.status(200).json({ docs: fallbackDocs });
        }
        
        return res.status(500).json({ error: 'Database error' });
    } finally {
        await pool.end();
    }
}