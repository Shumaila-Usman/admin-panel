import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchRestaurant, fetchRestaurantUsers, createRestaurantUser,
  updateRestaurantUser, changeUserPassword, deleteRestaurantUser,
  getUserCredentials,
} from '../services/api';
import { Restaurant, RestaurantUser, AppCredentials } from '../types';
import styles from './RestaurantUsersPage.module.css';

export default function RestaurantUsersPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [users, setUsers] = useState<RestaurantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Create user form ──────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLoginId, setNewLoginId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewCreatePw, setShowNewCreatePw] = useState(false);
  const [creating, setCreating] = useState(false);

  // ── Inline edit ───────────────────────────────────────────────────────────
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLoginId, setEditLoginId] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // ── App Password modal ────────────────────────────────────────────────────
  const [credUser, setCredUser] = useState<RestaurantUser | null>(null);
  const [credentials, setCredentials] = useState<AppCredentials | null>(null);
  const [credLoading, setCredLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

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

  // ── Create ────────────────────────────────────────────────────────────────
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

  // ── Inline edit ───────────────────────────────────────────────────────────
  function startEdit(u: RestaurantUser) {
    setEditUserId(u._id);
    setEditName(u.name);
    setEditLoginId(u.loginId || '');
    setEditEmail(u.email || '');
  }

  function cancelEdit() {
    setEditUserId(null);
    setEditName(''); setEditLoginId(''); setEditEmail('');
  }

  async function handleSaveEdit(u: RestaurantUser) {
    if (!editName.trim()) { alert('Name is required'); return; }
    if (!editLoginId.trim() && !editEmail.trim()) {
      alert('At least one of Login ID or Email is required');
      return;
    }
    setSavingEdit(true);
    try {
      const { user } = await updateRestaurantUser(u._id, {
        name: editName.trim(),
        loginId: editLoginId.trim() || undefined,
        email: editEmail.trim() || undefined,
      });
      setUsers((prev) => prev.map((x) => (x._id === u._id ? user : x)));
      cancelEdit();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSavingEdit(false);
    }
  }

  // ── Toggle active ─────────────────────────────────────────────────────────
  async function handleToggleActive(u: RestaurantUser) {
    try {
      const { user } = await updateRestaurantUser(u._id, { isActive: !u.isActive });
      setUsers((prev) => prev.map((x) => (x._id === u._id ? user : x)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(u: RestaurantUser) {
    if (!confirm(`Delete user "${u.loginId || u.email}"? This cannot be undone.`)) return;
    try {
      await deleteRestaurantUser(u._id);
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  // ── Open app password modal ───────────────────────────────────────────────
  async function openCredModal(u: RestaurantUser) {
    setCredUser(u);
    setCredentials(null);
    setNewPw('');
    setShowCurrentPw(false);
    setShowNewPw(false);
    setPwSuccess(false);
    setCredLoading(true);
    try {
      const creds = await getUserCredentials(u._id);
      setCredentials(creds);
    } catch (err: unknown) {
      // Show error in modal rather than crashing — backend now returns 200 always,
      // so this only fires on network errors or auth failures
      const msg = err instanceof Error ? err.message : 'Failed to load credentials.';
      setCredentials({
        loginId: u.loginId,
        email: u.email,
        currentAppPassword: null,
        appPasswordUpdatedAt: null,
        message: msg,
      });
    } finally {
      setCredLoading(false);
    }
  }

  // ── Save new app password ─────────────────────────────────────────────────
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!credUser) return;
    if (newPw.length < 3) { alert('Password must be at least 3 characters'); return; }
    setSavingPw(true);
    try {
      await changeUserPassword(credUser._id, newPw);

      // Re-fetch from backend so the displayed password is always the real stored value
      try {
        const freshCreds = await getUserCredentials(credUser._id);
        setCredentials(freshCreds);
      } catch {
        // Fallback: update local state if re-fetch fails
        setCredentials((prev) => prev ? {
          ...prev,
          currentAppPassword: newPw,
          appPasswordUpdatedAt: new Date().toISOString(),
          message: null,
        } : prev);
      }

      setUsers((prev) => prev.map((x) =>
        x._id === credUser._id ? { ...x, appPasswordUpdatedAt: new Date().toISOString() } : x
      ));
      setNewPw('');
      setShowNewPw(false);
      setShowCurrentPw(false);
      setPwSuccess(true);
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
            <div className={styles.pwRow}>
              <input
                className={styles.input}
                type={showNewCreatePw ? 'text' : 'password'}
                placeholder="Password (min 3 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required minLength={3}
              />
              <button type="button" className={styles.togglePwBtn} onClick={() => setShowNewCreatePw(v => !v)}>
                {showNewCreatePw ? 'Hide' : 'Show'}
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>
              At least one of Login ID or Email is required.
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
              {users.map((u) => {
                const isEditing = editUserId === u._id;
                return (
                  <tr key={u._id}>
                    <td>
                      {isEditing
                        ? <input className={styles.inlineInput} value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name *" autoFocus />
                        : <strong>{u.name}</strong>}
                    </td>
                    <td>
                      {isEditing
                        ? <input className={styles.inlineInput} value={editLoginId} onChange={(e) => setEditLoginId(e.target.value.toLowerCase().replace(/\s/g, '_'))} placeholder="Login ID" />
                        : <code style={{ fontSize: 13 }}>{u.loginId || '—'}</code>}
                    </td>
                    <td>
                      {isEditing
                        ? <input className={styles.inlineInput} type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email (optional)" />
                        : (u.email || '—')}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${u.isActive ? styles.active : styles.inactive}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {isEditing ? (
                        <div className={styles.actions}>
                          <button className={styles.btnSaveEdit} onClick={() => handleSaveEdit(u)} disabled={savingEdit}>
                            {savingEdit ? 'Saving…' : '✓ Save'}
                          </button>
                          <button className={styles.btnCancelEdit} onClick={cancelEdit}>Cancel</button>
                        </div>
                      ) : (
                        <div className={styles.actions}>
                          <button className={styles.btnEdit} onClick={() => startEdit(u)}>✏️ Edit</button>
                          <button className={styles.btnPw} onClick={() => openCredModal(u)}>🔑 App Password</button>
                          <button className={u.isActive ? styles.btnDeactivate : styles.btnActivate} onClick={() => handleToggleActive(u)}>
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className={styles.btnDelete} onClick={() => handleDelete(u)}>Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* App Password Modal */}
      {credUser && (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setCredUser(null); }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>🔑 App Login Password</h3>
              <button className={styles.modalClose} onClick={() => setCredUser(null)}>✕</button>
            </div>
            <p className={styles.modalSubtitle}>{credUser.name} — <code>{credUser.loginId || credUser.email}</code></p>

            {/* Current credentials block */}
            <div className={styles.credBlock}>
              <div className={styles.credRow}>
                <span className={styles.credLabel}>Current App Login ID</span>
                <span className={styles.credValue}>{credentials?.loginId || credUser.loginId || '—'}</span>
              </div>
              <div className={styles.credRow}>
                <span className={styles.credLabel}>Current Email</span>
                <span className={styles.credValue}>{credentials?.email || credUser.email || '—'}</span>
              </div>
              <div className={styles.credRowPw}>
                <span className={styles.credLabel}>Current App Password</span>
                {credLoading ? (
                  <span className={styles.credLoading}>Loading…</span>
                ) : credentials?.currentAppPassword ? (
                  <div className={styles.pwDisplay}>
                    <span className={styles.credValueMono}>
                      {showCurrentPw ? credentials.currentAppPassword : '•'.repeat(credentials.currentAppPassword.length || 8)}
                    </span>
                    <button className={styles.togglePwBtn} onClick={() => setShowCurrentPw(v => !v)}>
                      {showCurrentPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                ) : (
                  <span className={styles.credUnavailable}>
                    {credentials?.message || 'Current password not available for older records. Please set a new password below.'}
                  </span>
                )}
              </div>
              {credentials?.appPasswordUpdatedAt && (
                <p className={styles.credUpdated}>
                  Last updated: {new Date(credentials.appPasswordUpdatedAt).toLocaleString()}
                </p>
              )}
            </div>

            <div className={styles.divider} />

            {/* Success message */}
            {pwSuccess && (
              <div className={styles.successMsg}>✓ Password updated successfully</div>
            )}

            {/* New password form */}
            <form onSubmit={handleChangePassword}>
              <label className={styles.fieldLabel}>Change App Password</label>
              <div className={styles.pwRow}>
                <input
                  className={styles.input}
                  type={showNewPw ? 'text' : 'password'}
                  placeholder="New password (min 3 characters)"
                  value={newPw}
                  onChange={(e) => { setNewPw(e.target.value); setPwSuccess(false); }}
                  required minLength={3}
                  autoFocus
                />
                <button type="button" className={styles.togglePwBtn} onClick={() => setShowNewPw(v => !v)}>
                  {showNewPw ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className={styles.createActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setCredUser(null)}>Close</button>
                <button type="submit" className={styles.saveBtn} disabled={savingPw}>
                  {savingPw ? 'Saving...' : 'Save New Password'}
                </button>
              </div>
            </form>

            <p className={styles.securityNote}>
              🔒 Password visibility is available only to authorized MCP admins.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
