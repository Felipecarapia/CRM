import React from 'react';
import useStore from '../store/useStore';
import { UserPlus, Shield, User } from 'lucide-react';
import './Colaboradores.css';

const Colaboradores = () => {
  const perfis = useStore(state => state.perfis);

  return (
    <div className="colaboradores-page animate-fade-in">
      <div className="page-header flex-header">
        <div>
          <h1>Colaboradores e Permissões</h1>
          <p className="text-muted">Gerenciamento de acesso da sua equipe.</p>
        </div>
        <button className="btn btn-primary">
          <UserPlus size={18} /> Novo Colaborador
        </button>
      </div>

      <div className="perfis-grid">
        {perfis.map(perfil => (
          <div key={perfil.id} className="perfil-card glass-panel">
            <div className="perfil-avatar">
              <span className="text-large">{perfil.nome.charAt(0)}</span>
              {perfil.role === 'admin' ? 
                <div className="role-icon admin-icon"><Shield size={14} /></div> : 
                <div className="role-icon colab-icon"><User size={14} /></div>
              }
            </div>
            
            <h3 className="perfil-nome">{perfil.nome}</h3>
            <p className="perfil-email">{perfil.email}</p>
            
            <div className="role-badge">
              {perfil.role === 'admin' ? 'Administrador' : 'Colaborador'}
            </div>

             <div className="perfil-permissions">
                <h4>Acessos</h4>
                {perfil.role === 'admin' ? (
                   <ul>
                     <li className="allowed"><CheckIcon /> Acesso Total ao CRM</li>
                   </ul>
                ) : (
                   <ul>
                     <li className="allowed"><CheckIcon /> Visualizar Dashboard</li>
                     <li className="allowed"><CheckIcon /> Calendário & Kanban</li>
                     <li className="allowed"><CheckIcon /> Visualizar Clientes</li>
                     <li className="denied"><XIcon /> Configurações</li>
                     <li className="denied"><XIcon /> Excluir Tickets</li>
                   </ul>
                )}
             </div>

            <div className="card-actions">
              <button className="btn btn-secondary" style={{width: '100%'}}>Editar Permissões</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CheckIcon = () => <span style={{color: 'var(--color-success)', marginRight: '6px'}}>✓</span>;
const XIcon = () => <span style={{color: 'var(--color-danger)', marginRight: '6px'}}>x</span>;

export default Colaboradores;
