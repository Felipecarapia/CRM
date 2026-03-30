import React, { useState, useMemo, useCallback } from 'react';
import { 
  MoreHorizontal, 
  MessageCircle, 
  Calendar, 
  RefreshCw,
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

const getBadgeInfo = (appt) => {
  if (!appt) return null;
  const apptDate = new Date(`${appt.data}T${appt.horario}`);
  const now = new Date();
  const diffHours = (apptDate - now) / (1000 * 60 * 60);

  if (appt.status === 'Aguardando Confirmação') {
    return { text: 'Vencimento 2h', urgent: true };
  } else if (diffHours > 0 && diffHours < 24) {
    return { text: `Hoje ${appt.horario}`, urgent: false };
  } else if (diffHours >= 24 && diffHours < 48) {
    return { text: `Amanhã ${appt.horario}`, urgent: false };
  }
  return null;
};

const KanbanCard = React.memo(({ card, columnId, onCardClick }) => {
  const appt = card.appointment;
  const badge = getBadgeInfo(appt);

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
        <div className={`badge-vencimento ${badge.urgent ? 'urgent' : ''}`}>
          {badge.urgent ? <RefreshCw size={12} className="animate-spin-slow" /> : <Calendar size={12} />}
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

const KanbanColumn = React.memo(({ column, cards, isDraggingOver, onDragOver, onDrop, onDragEnter, onCardClick }) => (
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
    if (client) setSelectedClient(client);
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
          />
        ))}
      </div>

      {selectedClient && (
        <div className="modal-overlay animate-fade-in" onClick={() => setSelectedClient(null)}>
          <div className="modal-content glass-panel client-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="detail-avatar">
                  {selectedClient.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedClient.nome}</h2>
                  <span 
                    className="status-badge"
                    style={{ 
                      backgroundColor: `${statusColors[selectedClient.status] || '#94a3b8'}22`,
                      color: statusColors[selectedClient.status] || '#94a3b8',
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 600
                    }}
                  >
                    {statusLabels[selectedClient.status] || selectedClient.status}
                  </span>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedClient(null)}>
                <X size={24} />
              </button>
            </div>

            <div className="detail-body">
              <div className="detail-info">
                <div className="info-item">
                  <Phone size={16} />
                  <span>{selectedClient.telefone || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <Mail size={16} />
                  <span>{selectedClient.email || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <Clock size={16} />
                  <span>Criado em {new Date(selectedClient.criadoEm).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="info-item">
                  <DollarSign size={16} />
                  <span>R$ {clientLtv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {clientAppointments.length > 0 && (
                <div className="detail-appointments">
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', color: '#fff' }}>
                    <Tag size={14} style={{ marginRight: '6px' }} />
                    Histórico de Agendamentos
                  </h3>
                  <div className="appointments-list">
                    {clientAppointments.map(appt => (
                      <div key={appt.id} className="appointment-item">
                        <div className="appt-info">
                          <span className="appt-servico">{appt.servico}</span>
                          <span className="appt-date">{appt.data} às {appt.horario}</span>
                        </div>
                        <span className={`appt-status appt-${appt.status.toLowerCase().replace(/\s/g, '')}`}>
                          {appt.status}
                        </span>
                        {appt.notas && <p className="appt-notas">{appt.notas}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kanban;
