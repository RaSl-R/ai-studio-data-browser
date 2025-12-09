import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
  user: process.env.DB_USER || "neondb_owner",
  password: process.env.DB_PASSWORD || "npg_bqIR6D2UkALc",
  host: process.env.DB_HOST || "ep-icy-moon-a2bfjmyb-pooler.eu-central-1.aws.neon.tech",
  database: process.env.DB_NAME || "neondb",
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// API Routes

// Get all schemas (mock - return only public for now)
app.get('/api/schemas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name
    `);
    
    const schemas = result.rows.map(row => row.schema_name);
    res.json({ schemas });
  } catch (error) {
    console.error('Error fetching schemas:', error);
    res.status(500).json({ error: 'Failed to fetch schemas' });
  }
});

// Get tables for a schema
app.get('/api/schemas/:schemaName/tables', async (req, res) => {
  try {
    const { schemaName } = req.params;
    
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1
      ORDER BY table_name
    `, [schemaName]);
    
    const tables = result.rows.map(row => row.table_name);
    res.json({ tables });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Get table info
app.get('/api/schemas/:schemaName/tables/:tableName/info', async (req, res) => {
  try {
    const { schemaName, tableName } = req.params;
    
    // Get row count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM "${schemaName}"."${tableName}"`
    );
    
    // Get column count
    const columnsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
    `, [schemaName, tableName]);
    
    res.json({
      schema_name: schemaName,
      table_name: tableName,
      full_name: `${schemaName}.${tableName}`,
      row_count: parseInt(countResult.rows[0].count),
      column_count: parseInt(columnsResult.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching table info:', error);
    res.status(500).json({ error: 'Failed to fetch table info' });
  }
});

// Get table data with pagination and filtering
app.post('/api/schemas/:schemaName/tables/:tableName/data', async (req, res) => {
  try {
    const { schemaName, tableName } = req.params;
    const { page = 1, pageSize = 50, whereClause = '' } = req.body;
    
    const offset = (page - 1) * pageSize;
    
    // Build base query
    let baseQuery = `SELECT * FROM "${schemaName}"."${tableName}"`;
    
    // Add WHERE clause if provided (BASIC validation - improve in production!)
    if (whereClause && whereClause.trim()) {
      // Basic SQL injection prevention
      const forbidden = ['DELETE', 'UPDATE', 'INSERT', 'DROP', 'ALTER', 'EXEC', 'CREATE'];
      const upperWhere = whereClause.toUpperCase();
      
      if (forbidden.some(keyword => upperWhere.includes(keyword))) {
        return res.status(400).json({ error: 'Forbidden SQL keyword detected' });
      }
      
      if (whereClause.includes('--') || whereClause.includes('/*')) {
        return res.status(400).json({ error: 'SQL comment patterns not allowed' });
      }
      
      baseQuery += ` WHERE ${whereClause}`;
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as subquery`;
    const countResult = await pool.query(countQuery);
    const totalRows = parseInt(countResult.rows[0].total);
    
    // Get paginated data
    const dataQuery = `${baseQuery} ORDER BY 1 LIMIT $1 OFFSET $2`;
    const dataResult = await pool.query(dataQuery, [pageSize, offset]);
    
    const totalPages = Math.ceil(totalRows / pageSize);
    
    res.json({
      data: dataResult.rows,
      row_count: dataResult.rows.length,
      total_rows: totalRows,
      page: page,
      page_size: pageSize,
      total_pages: totalPages
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch data' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});