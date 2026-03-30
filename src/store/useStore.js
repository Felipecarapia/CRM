import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const useStore = create((set, get) => ({
  // Data State
  agendamentos: [],
  clientes: [],
  servicos: [],
  isLoading: false,
  error: null,

  // Kanban logic: Derived from clientes status
  getKanbanCards: () => {
    const { clientes, agendamentos } = get();
    const categories = ['novoLeads', 'qualificado', 'agendado', 'confirmado', 'compareceu', 'noShow', 'perdido', 'posVenda'];
    const acc = categories.reduce((obj, cat) => ({ ...obj, [cat]: [] }), {});
    
    clientes.forEach(c => {
      // Find the latest appointment for this client to show on the card
      const latestAppt = agendamentos
        .filter(a => a.clienteId === c.id)
        .sort((a, b) => new Date(b.data + 'T' + b.horario) - new Date(a.data + 'T' + a.horario))[0];

      if (acc[c.status]) {
        acc[c.status].push({
          id: c.id,
          title: latestAppt ? `[${latestAppt.servico}] - ${c.nome}` : c.nome,
          value: latestAppt ? `Agendado: ${latestAppt.data} ${latestAppt.horario}` : 'Sem agendamento',
          client: c.nome,
          appointment: latestAppt // Pass the whole object for the UI to use
        });
      } else {
        acc['novoLeads'].push({ id: c.id, title: c.nome, value: 'Novo Lead', client: c.nome });
      }
    });
    return acc;
  },

  perfis: [
    { id: 1, nome: 'Admin User', role: 'admin', email: 'admin@crm.com' },
    { id: 2, nome: 'Atendente 1', role: 'colaborador', email: 'atendimento@crm.com' },
  ],

  // Google Calendar access token
  googleAccessToken: (() => {
    try {
      const stored = localStorage.getItem('crm_gtoken');
      const expiresAt = localStorage.getItem('crm_gtoken_expires');
      if (stored && expiresAt && Date.now() < Number(expiresAt)) return stored;
    } catch {}
    return null;
  })(),

  // Actions
  fetchData: async () => {
    set({ isLoading: true });
    try {
      const [clientsRes, apptsRes, servicesRes] = await Promise.all([
        fetch(`${API_URL}/clientes`),
        fetch(`${API_URL}/agendamentos`),
        fetch(`${API_URL}/servicos`)
      ]);
      const clientes = await clientsRes.json();
      const agendamentos = await apptsRes.json();
      const servicos = await servicesRes.json();
      
      const mappedAgendamentos = agendamentos.map(a => ({
        ...a,
        cliente: a.clienteNome
      }));
      set({ clientes, agendamentos: mappedAgendamentos, servicos, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  addServico: async (novo) => {
    try {
      const res = await fetch(`${API_URL}/servicos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novo)
      });
      if (res.ok) {
        const saved = await res.json();
        set((state) => ({ servicos: [...state.servicos, saved] }));
      }
    } catch (err) {
      console.error('Error adding service:', err);
    }
  },

  deleteServico: async (id) => {
    try {
      const res = await fetch(`${API_URL}/servicos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        set((state) => ({ servicos: state.servicos.filter(s => s.id !== id) }));
      }
    } catch (err) {
      console.error('Error deleting service:', err);
    }
  },

  addCliente: async (novoCliente) => {
    try {
      const res = await fetch(`${API_URL}/agent/create-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoCliente)
      });
      const saved = await res.json();
      if (res.ok) {
        set((state) => ({ clientes: [...state.clientes, saved] }));
      }
    } catch (err) {
      console.error('Error adding client:', err);
    }
  },

  addAgendamento: async (novoAgendamento) => {
    try {
      // Find client ID by name or pass it directly (better for real DB)
      // For now, let's assume the UI passes a valid client object or ID
      const res = await fetch(`${API_URL}/agent/schedule-meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoAgendamento)
      });
      if (res.ok) {
        // Refresh all data to get updated joins/IDs
        get().fetchData();
      }
    } catch (err) {
      console.error('Error adding appointment:', err);
    }
  },

  deleteAgendamento: async (id) => {
    try {
      const res = await fetch(`${API_URL}/agendamentos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        set((state) => ({
          agendamentos: state.agendamentos.filter(a => Number(a.id) !== Number(id))
        }));
      }
    } catch (err) {
      console.error('Error deleting appointment:', err);
    }
  },

  updateAgendamentoStatus: (id, novoStatus) => set((state) => ({
    agendamentos: state.agendamentos.map(a => a.id === id ? { ...a, status: novoStatus } : a)
  })),

  setGoogleAccessToken: (token, expiresIn = 3600) => set(() => {
    if (token) {
      const expiresAt = Date.now() + (expiresIn - 60) * 1000;
      localStorage.setItem('crm_gtoken', token);
      localStorage.setItem('crm_gtoken_expires', String(expiresAt));
      localStorage.setItem('crm_google_was_connected', 'true');
    } else {
      localStorage.removeItem('crm_gtoken');
      localStorage.removeItem('crm_gtoken_expires');
    }
    return { googleAccessToken: token };
  }),

  moveKanbanCard: async (sourceList, destList, cardId) => {
    try {
      const res = await fetch(`${API_URL}/clientes/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: destList })
      });
      if (res.ok) {
        set((state) => ({
          clientes: state.clientes.map(c => c.id === cardId ? { ...c, status: destList } : c)
        }));
      }
    } catch (err) {
      console.error('Error moving card:', err);
    }
  }
}));

export default useStore;
