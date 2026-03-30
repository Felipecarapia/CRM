import React from 'react';
import { User, Bell, ChevronDown, Menu, X } from 'lucide-react';
import './Header.css';
import './Sidebar.css';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <header className="header">
      <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className="header-actions">
        <button className="btn-icon">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>

        <div className="user-profile-header">
           <div className="user-icon">
              <User size={18} />
           </div>
           <span className="user-name">Administrador</span>
           <ChevronDown size={14} className="text-muted" />
        </div>
      </div>
    </header>
  );
};

export default Header;
