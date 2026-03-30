import React from 'react';
import { User, Bell, ChevronDown } from 'lucide-react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-empty-left"></div>

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
