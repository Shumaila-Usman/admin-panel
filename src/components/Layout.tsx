import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { to: '/',             label: '📊 Dashboard',    end: true },
  { to: '/restaurants',  label: '🏪 Restaurants',   end: false },
  { to: '/live-orders',  label: '📡 Live Orders',   end: false },
  { to: '/orders',       label: '📋 All Orders',    end: false },
];

export default function Layout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    if (confirm('Sign out?')) {
      logout();
      navigate('/login');
    }
  }

  return (
    <div className={styles.shell}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.logo}>🍽️</span>
          <div>
            <div className={styles.appName}>Restaurant Admin</div>
            <div className={styles.appSub}>Order Management</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminInfo}>
            <div className={styles.adminName}>{admin?.name}</div>
            <div className={styles.adminEmail}>{admin?.email}</div>
            <div className={styles.adminRole}>{admin?.role}</div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={styles.main}>
        {/* Top bar (mobile) */}
        <header className={styles.topbar}>
          <button
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <span className={styles.topbarTitle}>Restaurant Admin</span>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
