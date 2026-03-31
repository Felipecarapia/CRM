import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Health check - responde sempre
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.json({ status: 'CRM Server Running' }));

// Serve static files
const distPath = path.join(__dirname, '..', 'dist');
try {
  app.use(express.static(distPath));
} catch (e) {
  // Static files may not exist during build
}

// Catch-all para React Router
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(503).json({ error: 'Database not ready' });
  try {
    res.sendFile(path.join(distPath, 'index.html'));
  } catch (e) {
    res.send('CRM Server Running');
  }
});

// Inicia o servidor IMEDIATAMENTE (antes de carregar Supabase)
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`CRM Server running on port ${port}`);
});

// Carrega Supabase de forma assíncrona (não bloqueia)
let supabase = null;

(async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      console.log('Supabase client created.');
      const { error } = await supabase.from('clientes').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        console.log('Supabase note:', error.message);
      } else {
        console.log('Supabase connected.');
      }
    } else {
      console.log('Supabase variables not set yet.');
    }
  } catch (err) {
    console.log('Supabase init skipped:', err.message);
  }
})();

// --- Servicos ---

app.get('/api/servicos', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const { data, error } = await supabase.from('servicos').select('*').order('nome', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servicos', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const { nome, preco } = req.body;
  if (!nome || !preco) return res.status(400).json({ error: 'Nome and Preço are required' });
  try {
    const { data, error } = await supabase.from('servicos').insert([{ nome, preco }]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/servicos/:id', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const { error } = await supabase.from('servicos').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Agent Tools ---

app.get('/api/agent/identify-client', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });
  try {
    const { data, error } = await supabase.from('clientes').select('*').eq('telefone', phone).single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json(data ? { found: true, client: data } : { found: false, message: 'Client not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agent/create-client', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const { nome, telefone, email } = req.body;
  console.log('[CREATE CLIENT] Request:', { nome, telefone, email });
  if (!nome || !telefone) return res.status(400).json({ error: 'Nome and Telefone are required' });
  try {
    const { data, error } = await supabase.from('clientes').insert([{ nome, telefone, email }]).select().single();
    if (error) {
      console.error('[CREATE CLIENT] Supabase error:', error);
      if (error.code === '23505' || error.message?.includes('unique')) {
        return res.status(409).json({ error: 'Client with this phone already exists' });
      }
      throw error;
    }
    console.log('[CREATE CLIENT] Success:', data);
    res.status(201).json(data);
  } catch (err) {
    console.error('[CREATE CLIENT] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agent/schedule-meeting', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const { clientId, servico, data, horario, notas } = req.body;
  if (!clientId || !servico || !data || !horario) {
    return res.status(400).json({ error: 'Missing required fields for scheduling' });
  }
  try {
    const { data: result, error } = await supabase.from('agendamentos').insert([{ clienteId: clientId, servico, data, horario, notas }]).select().single();
    if (error) throw error;
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Dashboard ---

app.get('/api/dashboard/stats', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const { count: totalClients } = await supabase.from('clientes').select('*', { count: 'exact', head: true });
    const { count: totalAppointments } = await supabase.from('agendamentos').select('*', { count: 'exact', head: true });
    const { data: leads } = await supabase.from('clientes').select('*').order('criadoEm', { ascending: false }).limit(5);
    res.json({
      totalClients: totalClients || 0,
      totalAppointments: totalAppointments || 0,
      latestLeads: leads || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/clientes', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const { data, error } = await supabase.from('clientes').select('*').order('nome', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/agendamentos', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const { data, error } = await supabase.from('agendamentos').select(`*, clientes!inner(nome, telefone)`).order('data', { ascending: false }).order('horario', { ascending: false });
    if (error) throw error;
    const mapped = (data || []).map(a => ({
      ...a,
      clienteNome: a.clientes?.nome,
      clienteTelefone: a.clientes?.telefone,
      clientes: undefined
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/clientes/:id', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });
  try {
    const { error } = await supabase.from('clientes').update({ status }).eq('id', id);
    if (error) throw error;
    res.json({ success: true, id, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/agendamentos/:id', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const { error } = await supabase.from('agendamentos').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/clientes/:id', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    await supabase.from('agendamentos').delete().eq('clienteId', req.params.id);
    const { error } = await supabase.from('clientes').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao excluir cliente:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Background Worker ---

setInterval(async () => {
  if (!supabase) return;
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const dateStr = twoHoursLater.toISOString().split('T')[0];
  const hours = String(twoHoursLater.getHours()).padStart(2, '0');
  const mins = String(twoHoursLater.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${mins}`;

  try {
    const { error } = await supabase.from('agendamentos').update({ status: 'Aguardando Confirmação' }).eq('data', dateStr).lte('horario', timeStr).eq('status', 'Agendado');
    if (error) console.error('Worker error:', error.message);
  } catch (err) {
    console.error('Worker error:', err.message);
  }
}, 60000);

app.listen(port, '0.0.0.0', () => {
  console.log(`CRM Agent API running at http://0.0.0.0:${port}`);
  console.log('Database: Supabase');
});

// Catch-all: serve React app for any non-API routes
app.get('*', (req, res) => {
  try {
    res.sendFile(path.join(distPath, 'index.html'));
  } catch (e) {
    res.send('CRM Server is Running');
  }
});
