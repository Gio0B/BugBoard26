import { Archive, Bug, LogOut, Plus, UserPlus } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const navItems = [
  { to: '/new', label: 'Nuova Issue', icon: Plus },
  { to: '/archived', label: 'Archivio', icon: Archive },
];

export function AppShell() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Vai al contenuto</a>
      <aside className="navigation-rail" aria-label="Navigazione principale">
        <NavLink to="/" end className={({ isActive }) => `brand-home ${isActive ? 'active' : ''}`} aria-label="Homepage">
          <span className="brand-mark"><Bug size={26} /></span>
          <span>Homepage</span>
        </NavLink>
        <nav className="rail-links">
          {navItems.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`}><span className="rail-icon"><Icon size={22} /></span><span>{label}</span></NavLink>)}
          {user?.role === 'ADMIN' && <NavLink to="/users/new" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`}><span className="rail-icon"><UserPlus size={22} /></span><span>Utente</span></NavLink>}
        </nav>
      </aside>
      <div className="main-column">
        <header className="top-app-bar"><div><span className="wordmark">BugBoard26</span><span className="role-chip">{user?.role}</span></div><div className="account-area"><span className="account-email">{user?.email}</span><button className="icon-button" onClick={logout} aria-label="Esci"><LogOut size={20} /></button></div></header>
        <main className="page-container" id="main-content" tabIndex="-1"><Outlet /></main>
      </div>
    </div>
  );
}
