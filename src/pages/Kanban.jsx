import React, { useState, useMemo, useCallback } from 'react';
import { 
  MoreHorizontal, 
  MessageCircle, 
  Calendar, 
  X,
  Phone,
  Mail,
  Clock,
  DollarSign,
  Tag,
  Eye
} from 'lucide-react';
import useStore from '../store/useStore';
import './Kanban.css';

const CATEGORIES = ['novoLeads', 'qualificado', 'agendado', 'confirmado', 'compareceu', 'noShow', 'perdido', 'posVenda'];

const COLUMNS = [
  { id: 'novoLeads', title: 'Novos Leads', color: '#94a3b8' },
  { id: 'qualificado', title: 'Qualificados', color: '#38bdf8' },
  { id: 'agendado', title: 'Agendados', color: '#f59e0b' },
  { id: 'confirmado', title: 'Confirmados', color: '#10b981' },
  { id: 'compareceu', title: 'Compareceram', color: '#059669' },
  { id: 'noShow', title: 'No-show', color: '#ef4444' },
  { id: 'perdido', title: 'Perdidos', color: '#64748b' },
  { id: 'posVenda', title: 'Pós-Venda', color: '#a855f7' }
];

const getBadgeInfo = (edital) => {
  if (!edital || !edital.data) return null;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (edital.data < today || (edital.data === today && edital.horario && edital.horario < currentTime)) {
    return { text: `Vencido ${edital.data}`, variant: 'expired' };
  } else if (edital.data === today) {
    return { text: `Hoje ${edital.horario || ''}`, variant: 'expired' };
  } else if (edital.data === tomorrowStr) {
    return { text: `Amanhã ${edital.horario || ''}`, variant: 'warning' };
  } else {
    return { text: edital.data, variant: 'normal' };
  }
};

const KanbanCard = React.memo(({ card, columnId, onCardClick, edital }) => {
  const appt = card.appointment;
  const badge = getBadgeInfo(edital);

  const handleDragStart = useCallback((e) => {
    e.dataTransfer.setData('cardId', String(card.id));
    e.dataTransfer.setData('sourceList', columnId);
    e.dataTransfer.effectAllowed = 'move';
    requestAnimationFrame(() => e.target.closest('.kanban-card').classList.add('is-dragging'));
  }, [card.id, columnId]);

  const handleDragEnd = useCallback((e) => {
    e.target.closest('.kanban-card')?.classList.remove('is-dragging');
  }, []);

  return (
    <div 
      className="kanban-card"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {badge && (
        <div className={`badge-vencimento badge-${badge.variant}`}>
          <Calendar size={12} />
          {badge.text}
        </div>
      )}
      <h4 className="card-title">{card.title}</h4>
      {appt?.notas && <div className="card-notes">{appt.notas}</div>}
      <div className="card-footer">
        <div className="card-client">
          <div className="client-avatar">{card.client.charAt(0)}</div>
          <span>{card.client}</span>
        </div>
        <button 
          className="card-view-btn"
          onClick={(e) => {
            e.stopPropagation();
            onCardClick(card.id);
          }}
        >
          <Eye size={14} />
        </button>
      </div>
    </div>
  );
});

const KanbanColumn = React.memo(({ column, cards, isDraggingOver, onDragOver, onDrop, onDragEnter, onCardClick, edictais }) => (
  <div 
    className={`kanban-column ${isDraggingOver ? 'column-hovered' : ''}`}
    onDrop={onDrop}
    onDragOver={onDragOver}
    onDragEnter={onDragEnter}
  >
    <div className="column-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: column.color,
          boxShadow: `0 0 10px ${column.color}44` 
        }}></div>
        <h3>{column.title}</h3>
        <span className="counter" style={{ marginLeft: '4px' }}>{cards.length}</span>
      </div>
      <MoreHorizontal size={16} style={{ color: 'var(--color-text-muted)', cursor: 'pointer' }} />
    </div>
    <div className="column-cards">
      {cards.map(card => (
        <KanbanCard 
          key={card.id} 
          card={card} 
          columnId={column.id}
          onCardClick={onCardClick}
          edital={edictais[card.id]}
        />
      ))}
      {isDraggingOver && <div className="drop-indicator"></div>}
    </div>
  </div>
));

const Kanban = () => {
  const clientes = useStore(state => state.clientes);
  const agendamentos = useStore(state => state.agendamentos);
  const moveKanbanCard = useStore(state => state.moveKanbanCard);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editalTitulo, setEditalTitulo] = useState('');
  const [editalDescricaoTitulo, setEditalDescricaoTitulo] = useState('');
  const [editalDescricao, setEditalDescricao] = useState('');
  const [editalData, setEditalData] = useState('');
  const [editalHorario, setEditalHorario] = useState('');
  const [edictais, setEdictais] = useState(() => JSON.parse(localStorage.getItem('crm_edictais') || '{}'));

  const kanbanCards = useMemo(() => {
    const acc = Object.fromEntries(CATEGORIES.map(cat => [cat, []]));
    const apptMap = new Map();
    
    for (const a of agendamentos) {
      const existing = apptMap.get(a.clienteId);
      if (!existing || new Date(`${a.data}T${a.horario}`) > new Date(`${existing.data}T${existing.horario}`)) {
        apptMap.set(a.clienteId, a);
      }
    }
    
    for (const c of clientes) {
      const latestAppt = apptMap.get(c.id);
      const card = {
        id: c.id,
        title: latestAppt ? `[${latestAppt.servico}] - ${c.nome}` : c.nome,
        client: c.nome,
        appointment: latestAppt
      };
      if (acc[c.status]) {
        acc[c.status].push(card);
      } else {
        acc.novoLeads.push(card);
      }
    }
    return acc;
  }, [clientes, agendamentos]);

  const handleCardClick = useCallback((cardId) => {
    const client = clientes.find(c => c.id === cardId);
    if (client) {
      setSelectedClient(client);
      const edictais = JSON.parse(localStorage.getItem('crm_edictais') || '{}');
      const existing = edictais[cardId];
      setEditalTitulo(existing?.titulo || '');
      setEditalDescricaoTitulo(existing?.descricaoTitulo || '');
      setEditalDescricao(existing?.descricao || '');
      setEditalData(existing?.data || '');
      setEditalHorario(existing?.horario || '');
    }
  }, [clientes]);

  const clientAppointments = useMemo(() => {
    if (!selectedClient) return [];
    return agendamentos
      .filter(a => a.clienteId === selectedClient.id)
      .sort((a, b) => new Date(b.data + 'T' + b.horario) - new Date(a.data + 'T' + a.horario));
  }, [selectedClient, agendamentos]);

  const clientLtv = useMemo(() => {
    return clientAppointments.reduce((sum, a) => sum + (a.valor || 0), 0);
  }, [clientAppointments]);

  const statusLabels = {
    novoLeads: 'Novo Lead',
    qualificado: 'Qualificado',
    agendado: 'Agendado',
    confirmado: 'Confirmado',
    compareceu: 'Compareceu',
    noShow: 'No-show',
    perdido: 'Perdido',
    posVenda: 'Pós-Venda'
  };

  const statusColors = {
    novoLeads: '#94a3b8',
    qualificado: '#38bdf8',
    agendado: '#f59e0b',
    confirmado: '#10b981',
    compareceu: '#059669',
    noShow: '#ef4444',
    perdido: '#64748b',
    posVenda: '#a855f7'
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e, columnId) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOverColumn(columnId);
  }, []);

  const handleDrop = useCallback((e, destList) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const cardId = parseInt(e.dataTransfer.getData('cardId'), 10);
    const sourceList = e.dataTransfer.getData('sourceList');
    if (sourceList !== destList && !isNaN(cardId)) {
      moveKanbanCard(sourceList, destList, cardId);
    }
  }, [moveKanbanCard]);

  return (
    <div className="kanban-page animate-fade-in">
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <h1 className="page-title">Fluxo Comercial</h1>
        <p className="text-muted" style={{ marginTop: '4px' }}>Arraste os cards para atualizar o status do funil.</p>
      </div>

      <div className="kanban-board">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            column={col}
            cards={kanbanCards[col.id]}
            isDraggingOver={draggedOverColumn === col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            onDragEnter={(e) => handleDragEnter(e, col.id)}
            onCardClick={handleCardClick}
            edictais={edictais}
          />
        ))}
      </div>

      {selectedClient && (
        <div className="modal-overlay animate-fade-in" onClick={() => setSelectedClient(null)}>
          <div className="modal-content glass-panel edital-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <input
                className="edital-title-input"
                placeholder="Título do Edital"
                value={editalTitulo}
                onChange={(e) => setEditalTitulo(e.target.value)}
              />
              <button className="btn-icon" onClick={() => setSelectedClient(null)}>
                <X size={24} />
              </button>
            </div>

            <div className="edital-body">
              <div className="edital-client-name">
                {selectedClient.nome}
              </div>

              <div className="edital-field">
                <input
                  className="edital-section-title-input"
                  placeholder="Título da seção"
                  value={editalDescricaoTitulo}
                  onChange={(e) => setEditalDescricaoTitulo(e.target.value)}
                />
                <textarea
                  className="edital-textarea"
                  placeholder="Digite a descrição do edital..."
                  value={editalDescricao}
                  onChange={(e) => setEditalDescricao(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="edital-field">
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px', display: 'block' }}>
                  Vencimento
                </label>
                <div className="edital-datetime-row">
                  <input
                    type="date"
                    className="edital-input"
                    value={editalData}
                    onChange={(e) => setEditalData(e.target.value)}
                  />
                  <input
                    type="time"
                    className="edital-input"
                    value={editalHorario}
                    onChange={(e) => setEditalHorario(e.target.value)}
                  />
                </div>
              </div>

              <div className="edital-actions">
                <button className="btn btn-outline" onClick={() => setSelectedClient(null)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={() => {
                  const updated = {
                    ...edictais,
                    [selectedClient.id]: {
                      titulo: editalTitulo,
                      descricaoTitulo: editalDescricaoTitulo,
                      descricao: editalDescricao,
                      data: editalData,
                      horario: editalHorario
                    }
                  };
                  localStorage.setItem('crm_edictais', JSON.stringify(updated));
                  setEdictais(updated);
                  setSelectedClient(null);
                }}>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kanban;
