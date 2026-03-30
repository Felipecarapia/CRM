import React, { useState } from 'react';
import useStore from '../store/useStore';
import { Plus, Trash2, Tag, DollarSign, Briefcase } from 'lucide-react';

const Servicos = () => {
  const servicos = useStore(state => state.servicos);
  const addServico = useStore(state => state.addServico);
  const deleteServico = useStore(state => state.deleteServico);
  
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome || !preco) return;
    addServico({ nome, preco: parseFloat(preco) });
    setNome('');
    setPreco('');
    setIsAdding(false);
  };

  return (
    <div className="servicos-page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Catálogo de Serviços</h1>
          <p className="text-muted" style={{ marginTop: '4px' }}>Gerencie os serviços que o OpenClaw oferecerá aos clientes.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
          <Plus size={18} /> {isAdding ? 'Cancelar' : 'Novo Serviço'}
        </button>
      </div>

      {isAdding && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', maxWidth: '500px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Nome do Serviço</label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Ex: Lavagem Completa, Consultoria..." 
                  style={{ width: '100%', padding: '12px 16px 12px 44px', background: 'rgba(0,0,0,0.2)', border: 'var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', outline: 'none' }} 
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Preço (R$)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  style={{ width: '100%', padding: '12px 16px 12px 44px', background: 'rgba(0,0,0,0.2)', border: 'var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', outline: 'none' }} 
                  value={preco}
                  onChange={e => setPreco(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>Salvar Serviço</button>
          </form>
        </div>
      )}

      <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {servicos.map(s => (
          <div key={s.id} className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', marginBottom: '8px' }}>
                  <Tag size={14} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID: {s.id}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', marginBottom: '8px' }}>{s.nome}</h3>
                <p style={{ color: 'var(--color-secondary)', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>R$ {s.preco.toFixed(2)}</p>
              </div>
              <button className="btn-icon" style={{ color: 'var(--color-danger)', opacity: 0.5 }} onClick={() => deleteServico(s.id)}>
                <Trash2 size={18} />
              </button>
            </div>
            {/* Background design element */}
            <Briefcase size={80} style={{ position: 'absolute', right: '-10px', bottom: '-20px', opacity: 0.03, transform: 'rotate(-15deg)' }} />
          </div>
        ))}

        {servicos.length === 0 && !isAdding && (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '64px', textAlign: 'center' }}>
            <Briefcase size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <h3>Nenhum serviço cadastrado</h3>
            <p className="text-muted">Comece cadastrando os serviços que sua empresa oferece.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Servicos;
