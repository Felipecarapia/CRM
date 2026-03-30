import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Plus, X } from 'lucide-react';
import useStore from '../store/useStore';
import './Clientes.css';

const Clientes = () => {
  const clientes = useStore(state => state.clientes);
  const addCliente = useStore(state => state.addCliente);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    status: 'Lead',
    ltv: 0
  });

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.telefone.includes(searchTerm)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if(formData.nome.trim() === '' || formData.telefone.trim() === '') return;
    
    addCliente(formData);
    
    // Reset and close
    setFormData({ nome: '', telefone: '', email: '', status: 'Lead', ltv: 0 });
    setIsModalOpen(false);
  };

  return (
    <div className="clientes-page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h1 className="page-title">Base de Clientes</h1>
          <p className="text-muted" style={{ fontWeight: 500, marginTop: '4px' }}>
            Gestão estratégica da sua carteira de contatos
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      <div className="table-container glass-panel">
        <div className="table-actions">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou telefone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-outline">
            <Filter size={18} /> Filtrar
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>WhatsApp</th>
              <th>E-mail</th>
              <th>Faturamento</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredClientes.map(cliente => (
              <tr key={cliente.id}>
                <td>
                  <div className="client-info">
                    <div className="avatar-sm">{cliente.nome.charAt(0).toUpperCase()}</div>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{cliente.nome}</span>
                  </div>
                </td>
                <td>{cliente.telefone}</td>
                <td className="text-muted">{cliente.email || 'N/A'}</td>
                <td><strong style={{ color: '#fff' }}>R$ {(cliente.ltv || 0).toLocaleString('pt-BR')}</strong></td>
                <td>
                  <span className={`status-badge stat-${cliente.status.toLowerCase()}`}>
                    {cliente.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-icon" style={{ opacity: 0.6 }}><MoreVertical size={18}/></button>
                </td>
              </tr>
            ))}
            {filteredClientes.length === 0 && (
              <tr>
                <td colSpan="6" style={{textAlign: 'center', padding: '64px', color: 'var(--color-text-muted)' }}>
                  Nenhum cliente encontrado na base.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modern SaaS Modal */}
      {isModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Novo Cliente</h2>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Nome Completo</label>
                  <input 
                    type="text" 
                    className="search-box input"
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: 'var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', outline: 'none' }}
                    placeholder="Ex: João da Silva" 
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>WhatsApp (Com DDD)</label>
                  <input 
                    type="tel" 
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: 'var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', outline: 'none' }}
                    placeholder="Ex: 11999999999" 
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>E-mail (Opcional)</label>
                  <input 
                    type="email" 
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: 'var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', outline: 'none' }}
                    placeholder="Ex: joao@email.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
