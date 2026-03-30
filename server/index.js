const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('CRM Server is Running'));

// Initialize SQLite database
const dbPath = path.resolve(__dirname, 'crm.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    createTables();
  }
});

function createTables() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefone TEXT UNIQUE NOT NULL,
      email TEXT,
      status TEXT DEFAULT 'Lead',
      criadoEm DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clienteId INTEGER,
      servico TEXT NOT NULL,
      data TEXT NOT NULL,
      horario TEXT NOT NULL,
      status TEXT DEFAULT 'Agendado',
      notas TEXT,
      FOREIGN KEY (clienteId) REFERENCES clientes (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS servicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      preco REAL NOT NULL
    )`);
    console.log('Tables initialized.');
  });
}

// --- Servicos Endpoints ---

app.get('/api/servicos', (req, res) => {
  db.all('SELECT * FROM servicos ORDER BY nome ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/servicos', (req, res) => {
  const { nome, preco } = req.body;
  if (!nome || !preco) return res.status(400).json({ error: 'Nome and Preço are required' });
  db.run('INSERT INTO servicos (nome, preco) VALUES (?, ?)', [nome, preco], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, nome, preco });
  });
});

app.delete('/api/servicos/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM servicos WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- Agent Tools Endpoints ---

/**
 * Identify a client by phone number
 * Used by OpenClaw to check if the lead is already in the database
 */
app.get('/api/agent/identify-client', (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  db.get('SELECT * FROM clientes WHERE telefone = ?', [phone], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      res.json({ found: true, client: row });
    } else {
      res.json({ found: false, message: 'Client not found' });
    }
  });
});

/**
 * Register a new client
 * Used by OpenClaw if identify-client returns false
 */
app.post('/api/agent/create-client', (req, res) => {
  const { nome, telefone, email } = req.body;
  if (!nome || !telefone) return res.status(400).json({ error: 'Nome and Telefone are required' });

  const stmt = db.prepare('INSERT INTO clientes (nome, telefone, email) VALUES (?, ?, ?)');
  stmt.run(nome, telefone, email, function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Client with this phone already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, nome, telefone, email });
  });
  stmt.finalize();
});

/**
 * Schedule a meeting
 * Used by OpenClaw after confirming with the user
 */
app.post('/api/agent/schedule-meeting', (req, res) => {
  const { clientId, servico, data, horario, notas } = req.body;
  if (!clientId || !servico || !data || !horario) {
    return res.status(400).json({ error: 'Missing required fields for scheduling' });
  }

  const stmt = db.prepare('INSERT INTO agendamentos (clienteId, servico, data, horario, notas) VALUES (?, ?, ?, ?, ?)');
  stmt.run(clientId, servico, data, horario, notas, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, clientId, servico, data, horario });
  });
  stmt.finalize();
});

// Dashboard Stats helper for frontend
app.get('/api/dashboard/stats', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM clientes', [], (err, clientCount) => {
    db.get('SELECT COUNT(*) as count FROM agendamentos', [], (err, apptCount) => {
      db.all('SELECT * FROM clientes ORDER BY criadoEm DESC LIMIT 5', [], (err, leads) => {
        res.json({
          totalClients: clientCount ? clientCount.count : 0,
          totalAppointments: apptCount ? apptCount.count : 0,
          latestLeads: leads || []
        });
      });
    });
  });
});

/**
 * List all clients
 */
app.get('/api/clientes', (req, res) => {
  db.all('SELECT * FROM clientes ORDER BY nome ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * List all appointments with client names
 */
app.get('/api/agendamentos', (req, res) => {
  const sql = `
    SELECT a.*, c.nome as clienteNome, c.telefone as clienteTelefone 
    FROM agendamentos a 
    JOIN clientes c ON a.clienteId = c.id 
    ORDER BY a.data DESC, a.horario DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * Update client status (e.g. for Kanban)
 */
app.patch('/api/clientes/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  db.run('UPDATE clientes SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ success: true, id, status });
  });
});

app.delete('/api/agendamentos/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM agendamentos WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(port, () => {
  console.log(`CRM Agent API running at http://localhost:${port}`);
  
  // Background worker: check for 2h deadlines every minute
  setInterval(() => {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    // Format to match DB: YYYY-MM-DD and HH:mm
    const dateStr = twoHoursLater.toISOString().split('T')[0];
    const hours = String(twoHoursLater.getHours()).padStart(2, '0');
    const mins = String(twoHoursLater.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${mins}`;

    // Update appointments that are in the 2h window and still just 'Agendado'
    // We update to 'Aguardando Confirmação'
    db.run(
      "UPDATE agendamentos SET status = 'Aguardando Confirmação' WHERE data = ? AND horario <= ? AND status = 'Agendado'",
      [dateStr, timeStr],
      function(err) {
        if (err) console.error('Worker error:', err.message);
        if (this.changes > 0) console.log(`[Worker] ${this.changes} appointments flagged for confirmation.`);
      }
    );
  }, 60000);
});
