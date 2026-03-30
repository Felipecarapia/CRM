import React, { useState } from 'react';
import { 
  MoreHorizontal, 
  MessageCircle, 
  Calendar, 
  RefreshCw 
} from 'lucide-react';
import useStore from '../store/useStore';
import './Kanban.css';

const Kanban = () => {
  const getKanbanCards = useStore(state => state.getKanbanCards);
  const moveKanbanCard = useStore(state => state.moveKanbanCard);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const kanbanCards = getKanbanCards();

  const columns = [
    { id: 'novoLeads', title: 'Novos Leads', color: '#94a3b8' },
    { id: 'qualificado', title: 'Qualificados', color: '#38bdf8' },
    { id: 'agendado', title: 'Agendados', color: '#f59e0b' },
    { id: 'confirmado', title: 'Confirmados', color: '#10b981' },
    { id: 'compareceu', title: 'Compareceram', color: '#059669' },
    { id: 'noShow', title: 'No-show', color: '#ef4444' },
    { id: 'perdido', title: 'Perdidos', color: '#64748b' },
    { id: 'posVenda', title: 'Pós-Venda', color: '#a855f7' }
  ];

  const handleDragStart = (e, cardId, sourceList) => {
    e.dataTransfer.setData('cardId', cardId);
    e.dataTransfer.setData('sourceList', sourceList);
    setIsDragging(true);
    
    // Add a small timeout to allow the browser to create the drag image before we change the style
    setTimeout(() => {
      e.target.classList.add('is-dragging');
    }, 0);
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    e.target.classList.remove('is-dragging');
    setDraggedOverColumn(null);
  };

  const handleDragEnter = (e, columnId) => {
    e.preventDefault();
    setDraggedOverColumn(columnId);
  };

  const handleDragLeave = (e) => {
    // We only clear if we are not moving into a child element
    // setDraggedOverColumn(null); // This can be flickering, handled better by onDragEnter of next
  };

  const handleDrop = (e, destList) => {
    e.preventDefault();
    setIsDragging(false);
    setDraggedOverColumn(null);
    const cardId = parseInt(e.dataTransfer.getData('cardId'), 10);
    const sourceList = e.dataTransfer.getData('sourceList');
    if (sourceList !== destList) {
      moveKanbanCard(sourceList, destList, cardId);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); };

  return (
    <div className={`kanban-page animate-fade-in ${isDragging ? 'dragging-active' : ''}`}>
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <h1 className="page-title">Fluxo Comercial</h1>
        <p className="text-muted" style={{ marginTop: '4px' }}>Arraste os cards para atualizar o status do funil.</p>
      </div>

      <div className="kanban-board">
        {columns.map(col => (
          <div 
            key={col.id} 
            className={`kanban-column ${draggedOverColumn === col.id ? 'column-hovered' : ''}`}
            onDrop={(e) => handleDrop(e, col.id)}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, col.id)}
          >
            <div className="column-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: col.color,
                  boxShadow: `0 0 10px ${col.color}44` 
                }}></div>
                <h3>{col.title}</h3>
                <span className="counter" style={{ marginLeft: '4px' }}>{kanbanCards[col.id].length}</span>
              </div>
              <MoreHorizontal size={16} style={{ color: 'var(--color-text-muted)', cursor: 'pointer' }} />
            </div>

            <div className="column-cards">
              {kanbanCards[col.id].map(card => {
                const appt = card.appointment;
                let badgeText = '';
                let isUrgent = false;

                if (appt) {
                  const apptDate = new Date(`${appt.data}T${appt.horario}`);
                  const now = new Date();
                  const diffHours = (apptDate - now) / (1000 * 60 * 60);

                  if (appt.status === 'Aguardando Confirmação') {
                    badgeText = 'Vencimento 2h';
                    isUrgent = true;
                  } else if (diffHours > 0 && diffHours < 24) {
                    badgeText = 'Hoje ' + appt.horario;
                  } else if (diffHours >= 24 && diffHours < 48) {
                    badgeText = 'Amanhã ' + appt.horario;
                  }
                }

                return (
                  <div 
                    key={card.id} 
                    className="kanban-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, card.id, col.id)}
                    onDragEnd={handleDragEnd}
                  >
                    {badgeText && (
                      <div className={`badge-vencimento ${isUrgent ? 'urgent' : ''}`}>
                        {isUrgent ? <RefreshCw size={12} className="animate-spin-slow" /> : <Calendar size={12} />}
                        {badgeText}
                      </div>
                    )}
                    
                    <h4 className="card-title">{card.title}</h4>
                    
                    {appt?.notas && (
                      <div className="card-notes">
                        {appt.notas}
                      </div>
                    )}
                    
                    <div className="card-footer">
                      <div className="card-client">
                        <div className="client-avatar">{card.client.charAt(0)}</div>
                        <span>{card.client}</span>
                      </div>
                      <MessageCircle size={14} style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
                    </div>
                  </div>
                );
              })}
              {draggedOverColumn === col.id && (
                <div className="drop-indicator"></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Kanban;
