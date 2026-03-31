const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('CRM Server is Running'));

const usePostgres = !!process.env.DATABASE_URL;
let pool;
let sqliteDb;

if (usePostgres) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  async function init() {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS clientes (
          id SERIAL PRIMARY KEY,
          nome TEXT NOT NULL,
          telefone TEXT UNIQUE NOT NULL,
          email TEXT,
          status TEXT DEFAULT 'novoLeads',
          criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS agendamentos (
          id SERIAL PRIMARY KEY,
          "clienteId" INTEGER REFERENCES clientes(id),
          servico TEXT NOT NULL,
          data TEXT NOT NULL,
          horario TEXT NOT NULL,
          status TEXT DEFAULT 'Agendado',
          notas TEXT
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS servicos (
          id SERIAL PRIMARY KEY,
          nome TEXT NOT NULL,
          preco REAL NOT NULL
        )
      `);
      console.log('PostgreSQL tables initialized.');
    } finally {
      client.release();
    }
  }
  init().catch(err => console.error('PostgreSQL init error:', err));
  console.log('Using PostgreSQL.');
} else {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.resolve(__dirname, 'crm.db');
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to SQLite.');
      sqliteDb.serialize(() => {
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS clientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          telefone TEXT UNIQUE NOT NULL,
          email TEXT,
          status TEXT DEFAULT 'Lead',
          criadoEm DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS agendamentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clienteId INTEGER,
          servico TEXT NOT NULL,
          data TEXT NOT NULL,
          horario TEXT NOT NULL,
          status TEXT DEFAULT 'Agendado',
          notas TEXT,
          FOREIGN KEY (clienteId) REFERENCES clientes (id)
        )`);
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS servicos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          preco REAL NOT NULL
        )`);
        console.log('SQLite tables initialized.');
      });
    }
  });
}

// Helper to run queries on either DB
async function query(sql, params = []) {
  if (usePostgres) {
    const pgSql = sql.replace(/clienteId/g, '"clienteId"').replace(/clienteNome/g, '"clienteNome"').replace(/clienteTelefone/g, '"clienteTelefone"');
    const result = await pool.query(pgSql, params);
    return result.rows;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

async function queryOne(sql, params = []) {
  if (usePostgres) {
    const pgSql = sql.replace(/clienteId/g, '"clienteId"').replace(/clienteNome/g, '"clienteNome"').replace(/clienteTelefone/g, '"clienteTelefone"');
    const result = await pool.query(pgSql, params);
    return result.rows[0] || null;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }
}

async function exec(sql, params = []) {
  if (usePostgres) {
    const pgSql = sql.replace(/clienteId/g, '"clienteId"').replace(/clienteNome/g, '"clienteNome"').replace(/clienteTelefone/g, '"clienteTelefone"');
    const result = await pool.query(pgSql, params);
    return { lastID: result.rows?.[0]?.id, changes: result.rowCount };
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
}

// --- Servicos ---

app.get('/api/servicos', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM servicos ORDER BY nome ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servicos', async (req, res) => {
  const { nome, preco } = req.body;
  if (!nome || !preco) return res.status(400).json({ error: 'Nome and Preço are required' });
  try {
    const result = await exec('INSERT INTO servicos (nome, preco) VALUES ($1, $2) RETURNING id', [nome, preco]);
    res.status(201).json({ id: result.lastID, nome, preco });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/servicos/:id', async (req, res) => {
  try {
    await exec('DELETE FROM servicos WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Agent Tools ---

app.get('/api/agent/identify-client', async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });
  try {
    const row = await queryOne('SELECT * FROM clientes WHERE telefone = $1', [phone]);
    res.json(row ? { found: true, client: row } : { found: false, message: 'Client not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agent/create-client', async (req, res) => {
  const { nome, telefone, email } = req.body;
  if (!nome || !telefone) return res.status(400).json({ error: 'Nome and Telefone are required' });
  try {
    const result = await exec('INSERT INTO clientes (nome, telefone, email) VALUES ($1, $2, $3) RETURNING id', [nome, telefone, email]);
    res.status(201).json({ id: result.lastID, nome, telefone, email });
  } catch (err) {
    if (err.message.includes('unique') || err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Client with this phone already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agent/schedule-meeting', async (req, res) => {
  const { clientId, servico, data, horario, notas } = req.body;
  if (!clientId || !servico || !data || !horario) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const result = await exec('INSERT INTO agendamentos ("clienteId", servico, data, horario, notas) VALUES ($1, $2, $3, $4, $5) RETURNING id', [clientId, servico, data, horario, notas]);
    res.status(201).json({ id: result.lastID, clientId, servico, data, horario });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Dashboard ---

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const clientCount = await queryOne('SELECT COUNT(*) as count FROM clientes');
    const apptCount = await queryOne('SELECT COUNT(*) as count FROM agendamentos');
    const leads = await query('SELECT * FROM clientes ORDER BY criadoEm DESC LIMIT 5');
    res.json({
      totalClients: parseInt(clientCount?.count || 0),
      totalAppointments: parseInt(apptCount?.count || 0),
      latestLeads: leads
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/clientes', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM clientes ORDER BY nome ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/agendamentos', async (req, res) => {
  try {
    const rows = await query(`
      SELECT a.*, c.nome as "clienteNome", c.telefone as "clienteTelefone" 
      FROM agendamentos a 
      JOIN clientes c ON a."clienteId" = c.id 
      ORDER BY a.data DESC, a.horario DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });
  try {
    const result = await exec('UPDATE clientes SET status = $1 WHERE id = $2', [status, id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ success: true, id, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/agendamentos/:id', async (req, res) => {
  try {
    await exec('DELETE FROM agendamentos WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Background Worker ---

setInterval(async () => {
  if (!usePostgres && !sqliteDb) return;
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const dateStr = twoHoursLater.toISOString().split('T')[0];
  const hours = String(twoHoursLater.getHours()).padStart(2, '0');
  const mins = String(twoHoursLater.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${mins}`;

  try {
    const result = await exec(
      "UPDATE agendamentos SET status = 'Aguardando Confirmação' WHERE data = $1 AND horario <= $2 AND status = 'Agendado'",
      [dateStr, timeStr]
    );
    if (result.changes > 0) console.log(`[Worker] ${result.changes} appointments flagged.`);
  } catch (err) {
    console.error('Worker error:', err.message);
  }
}, 60000);

app.listen(port, () => {
  console.log(`CRM Agent API running at http://localhost:${port}`);
  console.log(`Database: ${usePostgres ? 'PostgreSQL' : 'SQLite'}`);
});
