const express = require('express');
const cors = require('cors');
const { createClient } = require('@libsql/client');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('CRM Server is Running'));

// Turso client (SQLite on the cloud)
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function initTables() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        telefone TEXT UNIQUE NOT NULL,
        email TEXT,
        status TEXT DEFAULT 'novoLeads',
        criadoEm DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS agendamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clienteId INTEGER,
        servico TEXT NOT NULL,
        data TEXT NOT NULL,
        horario TEXT NOT NULL,
        status TEXT DEFAULT 'Agendado',
        notas TEXT,
        FOREIGN KEY (clienteId) REFERENCES clientes (id)
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS servicos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        preco REAL NOT NULL
      )
    `);
    console.log('Turso tables initialized.');
  } catch (err) {
    console.error('Error initializing tables:', err.message);
  }
}

initTables();

// --- Servicos ---

app.get('/api/servicos', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM servicos ORDER BY nome ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servicos', async (req, res) => {
  const { nome, preco } = req.body;
  if (!nome || !preco) return res.status(400).json({ error: 'Nome and Preço are required' });
  try {
    const result = await db.execute({ sql: 'INSERT INTO servicos (nome, preco) VALUES (?, ?)', args: [nome, preco] });
    res.status(201).json({ id: result.lastInsertRowid, nome, preco });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/servicos/:id', async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM servicos WHERE id = ?', args: [req.params.id] });
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
    const result = await db.execute({ sql: 'SELECT * FROM clientes WHERE telefone = ?', args: [phone] });
    const row = result.rows[0];
    res.json(row ? { found: true, client: row } : { found: false, message: 'Client not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agent/create-client', async (req, res) => {
  const { nome, telefone, email } = req.body;
  if (!nome || !telefone) return res.status(400).json({ error: 'Nome and Telefone are required' });
  try {
    const result = await db.execute({
      sql: 'INSERT INTO clientes (nome, telefone, email) VALUES (?, ?, ?)',
      args: [nome, telefone, email]
    });
    res.status(201).json({ id: result.lastInsertRowid, nome, telefone, email });
  } catch (err) {
    if (err.message.includes('UNIQUE') || err.message.includes('unique')) {
      return res.status(409).json({ error: 'Client with this phone already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agent/schedule-meeting', async (req, res) => {
  const { clientId, servico, data, horario, notas } = req.body;
  if (!clientId || !servico || !data || !horario) {
    return res.status(400).json({ error: 'Missing required fields for scheduling' });
  }
  try {
    const result = await db.execute({
      sql: 'INSERT INTO agendamentos (clienteId, servico, data, horario, notas) VALUES (?, ?, ?, ?, ?)',
      args: [clientId, servico, data, horario, notas]
    });
    res.status(201).json({ id: result.lastInsertRowid, clientId, servico, data, horario });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Dashboard ---

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const clientCount = await db.execute('SELECT COUNT(*) as count FROM clientes');
    const apptCount = await db.execute('SELECT COUNT(*) as count FROM agendamentos');
    const leads = await db.execute('SELECT * FROM clientes ORDER BY criadoEm DESC LIMIT 5');
    res.json({
      totalClients: Number(clientCount.rows[0]?.count || 0),
      totalAppointments: Number(apptCount.rows[0]?.count || 0),
      latestLeads: leads.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/clientes', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM clientes ORDER BY nome ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/agendamentos', async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT a.*, c.nome as clienteNome, c.telefone as clienteTelefone 
      FROM agendamentos a 
      JOIN clientes c ON a.clienteId = c.id 
      ORDER BY a.data DESC, a.horario DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });
  try {
    const result = await db.execute({ sql: 'UPDATE clientes SET status = ? WHERE id = ?', args: [status, id] });
    if (result.rowsAffected === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ success: true, id, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/agendamentos/:id', async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM agendamentos WHERE id = ?', args: [req.params.id] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Background Worker ---

setInterval(async () => {
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const dateStr = twoHoursLater.toISOString().split('T')[0];
  const hours = String(twoHoursLater.getHours()).padStart(2, '0');
  const mins = String(twoHoursLater.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${mins}`;

  try {
    const result = await db.execute({
      sql: "UPDATE agendamentos SET status = 'Aguardando Confirmação' WHERE data = ? AND horario <= ? AND status = 'Agendado'",
      args: [dateStr, timeStr]
    });
    if (result.rowsAffected > 0) console.log(`[Worker] ${result.rowsAffected} appointments flagged.`);
  } catch (err) {
    console.error('Worker error:', err.message);
  }
}, 60000);

app.listen(port, () => {
  console.log(`CRM Agent API running at http://localhost:${port}`);
  console.log('Database: Turso (SQLite on the cloud)');
});
