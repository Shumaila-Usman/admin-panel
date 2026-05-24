import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchRestaurant, fetchRestaurantUsers, createRestaurantUser,
  updateRestaurantUser, changeUserPassword, deleteRestaurantUser,
} from '../services/api';
import { Restaurant, RestaurantUser } from '../types';
import styles from './RestaurantUsersPage.module.css';

export default function RestaurantUsersPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [users, setUsers] = useState<RestaurantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create user form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLoginId, setNewLoginId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  // Change password modal
  const [pwUserId, setPwUserId] = useState<string | null>(null);
  const [newPw, setNewPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  async function load() {
    if (!restaurantId) return;
    try {
      const [{ restaurant: r }, { users: u }] = await Promise.all([
        fetchRestaurant(restaurantId),
        fetchRestaurantUsers(restaurantId),
      ]);
      setRestaurant(r);
      setUsers(u);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [restaurantId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurantId) return;
    if (!newLoginId && !newEmail) {
      alert('Please enter a Login ID or Email (at least one is required)');
      return;
    }
    if (newPassword.length < 3) {
      alert('Password must be at least 3 characters');
      return;
    }
    setCreating(true);
    try {
      const { user } = await createRestaurantUser(restaurantId, {
        name: newName,
        loginId: newLoginId || undefined,
        email: newEmail || undefined,
        password: newPassword,
      });
      setUsers((prev) => [...prev, user]);
      setShowCreate(false);
      setNewName(''); setNewLoginId(''); setNewEmail(''); setNewPassword('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(u: RestaurantUser) {
    try {
      const { user } = await updateRestaurantUser(u._id, { isActive: !u.isActive });
      setUsers((prev) => prev.map((x) => (x._id === u._id ? user : x)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  async function handleDelete(u: RestaurantUser) {
    if (!confirm(`Delete user "${u.loginId || u.email}"?`)) return;
    try {
      await deleteRestaurantUser(u._id);
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!pwUserId) return;
    if (newPw.length < 3) { alert('Password must be at least 3 characters'); return; }
    setSavingPw(true);
    try {
      await changeUserPassword(pwUserId, newPw);
      setPwUserId(null);
      setNewPw('');
      alert('Password changed successfully');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  }

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/restaurants')}>← Restaurants</button>
        <div>
          <h1 className={styles.pageTitle}>Restaurant App Login — {restaurant?.name}</h1>
          <p className={styles.subtitle}>Owner/staff accounts for the mobile app. Login with Login ID or Email.</p>
        </div>
        <button className={styles.addButton} onClick={() => setShowCreate(true)}>+ Add User</button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Create user form */}
      {showCreate && (
        <div className={styles.createCard}>
          <h3 className={styles.createTitle}>New Restaurant App Login</h3>
          <form onSubmit={handleCreate} className={styles.createForm}>
            <input className={styles.input} placeholder="Full name *" value={newName} onChange={(e) => setNewName(e.target.value)} required />
            <input
              className={styles.input}
              placeholder="Login ID (e.g. onopoke_owner)"
              value={newLoginId}
              onChange={(e) => setNewLoginId(e.target.value.toLowerCase().replace(/\s/g, '_'))}
            />
            <input className={styles.input} type="email" placeholder="Email (optional)" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <input
              className={styles.input}
              type="password"
              placeholder="Password (min 3 chars, e.g. 123)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={3}
            />
            <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>
              At least one of Login ID or Email is required. Owner can login with either.
            </p>
            <div className={styles.createActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className={styles.saveBtn} disabled={creating}>
                {creating ? 'Creating...' : 'Create Login'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      {users.length === 0 ? (
        <div className={styles.empty}>No users yet. Add the first restaurant app login.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Login ID</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td><strong>{u.name}</strong></td>
                  <td><code style={{ fontSize: 13 }}>{u.loginId || '—'}</code></td>
                  <td>{u.email || '—'}</td>
                  <td>
                    <span className={`${styles.badge} ${u.isActive ? styles.active : styles.inactive}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.btnPw} onClick={() => { setPwUserId(u._id); setNewPw(''); }}>
                        Reset Password
                      </button>
                      <button
                        className={u.isActive ? styles.btnDeactivate : styles.btnActivate}
                        onClick={() => handleToggleActive(u)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className={styles.btnDelete} onClick={() => handleDelete(u)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Change password modal */}
      {pwUserId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Reset Password</h3>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
              Set a new password for this login. Minimum 3 characters.
            </p>
            <form onSubmit={handleChangePassword}>
              <input
                className={styles.input}
                type="password"
                placeholder="New password (min 3 chars)"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                minLength={3}
                autoFocus
              />
              <div className={styles.createActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setPwUserId(null)}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={savingPw}>
                  {savingPw ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
