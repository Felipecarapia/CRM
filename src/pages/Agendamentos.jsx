import React, { useState, useCallback, useEffect, useMemo } from 'react';
import useStore from '../store/useStore';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { useGoogleLogin } from '@react-oauth/google';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, X, RefreshCw, LogIn, Trash2, MapPin, AlignLeft, Pencil, Database, Globe } from 'lucide-react';
import { fetchGoogleCalendarEvents, createGoogleCalendarEvent, deleteGoogleCalendarEvent, updateGoogleCalendarEvent } from '../services/googleCalendarService';
import './Agendamentos.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Configuração do localizador pt-BR
const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

// Mensagens/labels em Português
const messages = {
  today: 'Hoje',
  previous: 'Voltar',
  next: 'Avançar',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'Nenhum agendamento neste período.',
  showMore: (total) => `+ ${total} mais`,
};

const Agendamentos = () => {
  const accessToken = useStore(state => state.googleAccessToken);
  const setAccessToken = useStore(state => state.setGoogleAccessToken);
  const clientes = useStore(state => state.clientes);
  const localAgendamentos = useStore(state => state.agendamentos);
  const fetchData = useStore(state => state.fetchData);
  
  const [googleEvents, setGoogleEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Merge Local and Google events
  const allEvents = useMemo(() => {
    // Local DB events mapped to Calendar format
    const local = localAgendamentos.map(a => {
      const [year, month, day] = a.data.split('-').map(Number);
      const [hour, min] = a.horario.split(':').map(Number);
      const startDate = new Date(year, month - 1, day, hour, min);
      const endDate = new Date(year, month - 1, day, hour + 1, min);
      
      return {
        id: `local-${a.id}`,
        title: a.clienteNome ? `${a.servico}: ${a.clienteNome}` : `${a.servico}: ${a.cliente}`,
        start: startDate,
        end: endDate,
        resource: 'local',
        description: a.notas,
        source: 'local'
      };
    });

    return [...local, ...googleEvents];
  }, [localAgendamentos, googleEvents]);

  // Modal de criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start: '',
    end: '',
    clientId: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  // Modal de detalhes
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [autoConnecting, setAutoConnecting] = useState(false);

  const login = useGoogleLogin({
    flow: 'implicit',
    ux_mode: 'popup',
    onSuccess: async (tokenResponse) => {
      setAccessToken(tokenResponse.access_token, tokenResponse.expires_in);
      setError(null);
      setAutoConnecting(false);
    },
    onError: (err) => {
      if (autoConnecting) {
        setAutoConnecting(false);
        setError(null);
      } else {
        setError('Falha no login do Google.');
      }
      console.error(err);
    },
    scope: 'https://www.googleapis.com/auth/calendar',
  });

  const loadEvents = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const timeMin = new Date(currentDate.getFullYear(), 0, 1);
      const timeMax = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59);
      const fetched = await fetchGoogleCalendarEvents(accessToken, timeMin, timeMax);
      setGoogleEvents(fetched.map(e => ({ ...e, source: 'google' })));
    } catch (err) {
      setError('Sessão do Google expirada.');
      setAccessToken(null);
      localStorage.removeItem('crm_google_was_connected');
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentDate, setAccessToken]);

  useEffect(() => {
    if (accessToken) loadEvents();
  }, [accessToken, loadEvents]);

  useEffect(() => {
    fetchData(); // Sync local data
  }, [fetchData]);

  const handleSelectSlot = ({ start, end }) => {
    const fmt = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setFormData({
      title: '',
      description: '',
      location: '',
      start: fmt(start),
      end: fmt(end),
      clientId: '',
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const handleSaveLocal = async (e) => {
    e.preventDefault();
    if (!formData.clientId || !formData.start || !formData.end) return;

    const [date, time] = formData.start.split('T');
    const newAppt = {
      clientId: Number(formData.clientId),
      servico: formData.title || 'Reunião CRM',
      data: date,
      horario: time.substring(0, 5),
      notas: formData.description
    };

    setLoading(true);
    await useStore.getState().addAgendamento(newAppt);
    setIsModalOpen(false);
    setLoading(false);
  };

  const EventComponent = ({ event }) => (
    <div className="rbc-custom-event">
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {event.source === 'local' ? <Database size={10} /> : <Globe size={10} />}
        <strong className="rbc-event-title">{event.title}</strong>
      </div>
      {event.location && <span className="rbc-event-location">📍 {event.location}</span>}
    </div>
  );

  return (
    <div className="agendamentos-page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Agenda Geral</h1>
          <p className="text-muted" style={{ fontWeight: 500, marginTop: '4px' }}>
            {accessToken ? `Sincronizado com Google Calendar` : 'Agendamentos locais do CRM'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!accessToken && (
            <button className="btn btn-outline" onClick={() => login()}>
              <Globe size={18} /> Conectar Google
            </button>
          )}
          <button className="btn btn-primary" onClick={() => handleSelectSlot({ start: new Date(), end: new Date(Date.now() + 3600000) })}>
            <Plus size={18} /> Novo Agendamento
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="calendar-container glass-panel" style={{ height: '75vh' }}>
        <Calendar
          localizer={localizer}
          events={allEvents}
          view={view}
          onView={setView}
          date={currentDate}
          onNavigate={setCurrentDate}
          startAccessor="start"
          endAccessor="end"
          messages={messages}
          culture="pt-BR"
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          components={{ event: EventComponent }}
          style={{ height: '100%' }}
          popup
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.source === 'local' ? 'var(--color-primary)' : '#4285F4',
              border: 'none',
              opacity: 0.9
            }
          })}
        />
      </div>

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Novo Agendamento</h2>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form className="modal-body" onSubmit={handleSaveLocal}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Selecionar Cliente</label>
                   <select 
                     style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: 'var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', outline: 'none' }}
                     value={formData.clientId}
                     onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                     required
                   >
                     <option value="">-- Escolha um cliente --</option>
                     {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                   </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Início</label>
                    <input type="datetime-local" style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: 'var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', outline: 'none' }} value={formData.start} onChange={e => setFormData({ ...formData, start: e.target.value })} required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Fim</label>
                    <input type="datetime-local" style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: 'var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', outline: 'none' }} value={formData.end} onChange={e => setFormData({ ...formData, end: e.target.value })} required />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Título / Serviço</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Consultoria, Demo, Reunião..." 
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: 'var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', outline: 'none' }} 
                    value={formData.title} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Descrição / Notas</label>
                  <textarea 
                    placeholder="Adicione observações importantes para esta reunião..." 
                    rows={3}
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: 'var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', outline: 'none', resize: 'vertical' }} 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar na Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailOpen && selectedEvent && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsDetailOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedEvent.title}</h2>
              <button className="btn-icon" onClick={() => setIsDetailOpen(false)}><X size={24} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                {format(selectedEvent.start, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              {selectedEvent.description && (
                <div style={{ background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '8px', fontSize: '0.875rem' }}>
                  {selectedEvent.description}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                 {selectedEvent.source === 'google' && <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>✓ Sincronizado com Google</span>}
                 {selectedEvent.source === 'local' && (
                    <button 
                      className="btn btn-icon" 
                      style={{ color: 'var(--color-danger)' }}
                      onClick={async () => {
                        const id = selectedEvent.id.replace('local-', '');
                        await useStore.getState().deleteAgendamento(Number(id));
                        setIsDetailOpen(false);
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agendamentos;
