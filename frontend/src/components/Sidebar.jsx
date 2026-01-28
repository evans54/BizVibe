import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', caption: 'Live overview' },
  { to: '/keywords', label: 'Keywords', caption: 'Ranking trends' },
  { to: '/reviews', label: 'Reviews', caption: 'Reputation hub' },
  { to: '/automation', label: 'Automation', caption: 'Smart workflows' },
  { to: '/reports', label: 'Reports', caption: 'Exports & insights' },
  { to: '/settings', label: 'Settings', caption: 'Profile & access' }
];

const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">BV</div>
        <div>
          <h1>BizVibe</h1>
          <p>Local SEO Studio</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <div>
              <span>{item.label}</span>
              <small>{item.caption}</small>
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="avatar-circle">{user?.name?.slice(0, 2).toUpperCase()}</div>
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
        </div>
        <button className="secondary-button" onClick={logout} type="button">
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
