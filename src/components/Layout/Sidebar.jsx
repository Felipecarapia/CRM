import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Layout, 
  Calendar, 
  Grid, 
  Users, 
  MessageCircle,
  Settings,
  Briefcase
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <h1 className="sidebar-logo">Control <span className="logo-accent">CRM</span></h1>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Layout size={18} />
              <span>Dashboard</span>
            </NavLink>
          </li>
        </ul>

        <div className="nav-group-title">Menu Principal</div>
        <ul>
          <li>
            <NavLink to="/agendamentos" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Calendar size={18} />
              <span>Agendamentos</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/kanban" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Grid size={18} />
              <span>Kanban da Venda</span>
            </NavLink>
          </li>
        </ul>

        <div className="nav-group-title">Gestão</div>
        <ul>
          <li>
            <NavLink to="/clientes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Users size={18} />
              <span>Clientes</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/colaboradores" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <MessageCircle size={18} />
              <span>Colaboradores</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/servicos" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Briefcase size={18} />
              <span>Serviços</span>
            </NavLink>
          </li>
        </ul>
        
        <div className="nav-group-title">Sistema</div>
        <ul>
          <li>
            <NavLink to="/configuracoes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Settings size={18} />
              <span>Configurações</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
