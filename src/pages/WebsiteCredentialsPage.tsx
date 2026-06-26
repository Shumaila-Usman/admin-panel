import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRestaurant, fetchWebsiteCredentials, saveWebsiteCredentials } from '../services/api';
import { Restaurant, WebsiteCredentials } from '../types';
import styles from './WebsiteCredentialsPage.module.css';

export default function WebsiteCredentialsPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form fields
  const [url, setUrl] = useState('');
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [notes, setNotes] = useState('');
  const [integrationType, setIntegrationType] = useState<'manual' | 'api' | 'shared_db'>('manual');
  const [passwordUpdatedAt, setPasswordUpdatedAt] = useState<string | null>(null);
  const [credMessage, setCredMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) return;
    async function load() {
      try {
        const [{ restaurant: r }, creds] = await Promise.all([
          fetchRestaurant(restaurantId!),
          fetchWebsiteCredentials(restaurantId!),
        ]);
        setRestaurant(r);
        populateForm(creds);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [restaurantId]);

  function populateForm(creds: WebsiteCredentials) {
    setUrl(creds.websiteAdminUrl || '');
    setLoginId(creds.websiteAdminLoginId || '');
    setEmail(creds.websiteAdminEmail || '');
    setCurrentPassword(creds.websiteAdminPassword);
    setNotes(creds.websiteAdminNotes || '');
    setIntegrationType(creds.websiteAdminIntegrationType || 'manual');
    setPasswordUpdatedAt(creds.websiteAdminPasswordUpdatedAt);
    setCredMessage(creds.message);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurantId) return;
    setSaving(true);
    setSuccessMsg('');
    setError('');
    try {
      const payload: Record<string, string> = {
        websiteAdminUrl: url,
        websiteAdminLoginId: loginId,
        websiteAdminEmail: email,
        websiteAdminNotes: notes,
        websiteAdminIntegrationType: integrationType,
      };
      if (newPassword) {
        payload.websiteAdminPassword = newPassword;
      }
      const result = await saveWebsiteCredentials(restaurantId, payload);

      // Update displayed current password if a new one was set
      if (newPassword) {
        setCurrentPassword(newPassword);
        setPasswordUpdatedAt(new Date().toISOString());
        setCredMessage(null);
        setNewPassword('');
        setShowNewPw(false);
      }

      // Show sync status
      if (result.sync) {
        if (result.sync.success) {
          setSuccessMsg('Website credentials saved ✓ and password updated on the restaurant site.');
        } else {
          setSuccessMsg('Credentials saved in MCP, but site sync failed: ' + result.sync.message);
        }
      } else {
        setSuccessMsg('Website credentials saved successfully.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/restaurants')}>← Restaurants</button>
        <div>
          <h1 className={styles.pageTitle}>Website Admin Panel — {restaurant?.name}</h1>
          <p className={styles.subtitle}>Store and manage the restaurant website admin panel credentials in MCP.</p>
        </div>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className={styles.openBtn}>
            🌐 Open Website Admin Panel
          </a>
        )}
      </div>

      {/* Integration type notice */}
      {integrationType === 'manual' && (
        <div className={styles.noticeCard}>
          <span className={styles.noticeIcon}>ℹ️</span>
          <span>
            Currently this stores and manages the website admin credentials inside MCP.
            Automatic password syncing to the restaurant website requires website-specific integration.
          </span>
        </div>
      )}

      {error && <div className={styles.errorMsg}>{error}</div>}
      {successMsg && <div className={styles.successMsg}>✓ {successMsg}</div>}

      <form onSubmit={handleSave} className={styles.form}>

        {/* Website Admin URL */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Website Admin Panel</h2>
          <div className={styles.field}>
            <label className={styles.label}>Website Admin URL</label>
            <div className={styles.urlRow}>
              <input
                className={styles.input}
                type="url"
                placeholder="https://yourrestaurant.com/admin"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer" className={styles.urlOpenBtn}>
                  Open ↗
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Login credentials */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Website Admin Login ID</h2>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Website Admin Login ID / Username</label>
              <input
                className={styles.input}
                placeholder="admin or username"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Website Admin Email</label>
              <input
                className={styles.input}
                type="email"
                placeholder="admin@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Password */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Website Admin Password</h2>

          {/* Current password display */}
          <div className={styles.currentPwBlock}>
            <label className={styles.label}>Current Website Admin Password</label>
            {currentPassword ? (
              <div className={styles.pwDisplay}>
                <span className={styles.pwValue}>
                  {showCurrentPw ? currentPassword : '•'.repeat(currentPassword.length || 8)}
                </span>
                <button type="button" className={styles.togglePwBtn} onClick={() => setShowCurrentPw(v => !v)}>
                  {showCurrentPw ? 'Hide' : 'Show'}
                </button>
              </div>
            ) : (
              <p className={styles.pwUnavailable}>
                {credMessage || 'No website admin password stored yet.'}
              </p>
            )}
            {passwordUpdatedAt && (
              <p className={styles.pwUpdated}>Last updated: {new Date(passwordUpdatedAt).toLocaleString()}</p>
            )}
          </div>

          {/* New password */}
          <div className={styles.field} style={{ marginTop: 12 }}>
            <label className={styles.label}>New Website Admin Password <span className={styles.optional}>(leave blank to keep current)</span></label>
            <div className={styles.pwRow}>
              <input
                className={styles.input}
                type={showNewPw ? 'text' : 'password'}
                placeholder="Enter new password to update"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button type="button" className={styles.togglePwBtn} onClick={() => setShowNewPw(v => !v)}>
                {showNewPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        </div>

        {/* Notes & Integration */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Notes & Integration</h2>
          <div className={styles.field}>
            <label className={styles.label}>Notes</label>
            <textarea
              className={styles.textarea}
              placeholder="Any notes about this website admin panel..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Integration Type</label>
            <select
              className={styles.select}
              value={integrationType}
              onChange={(e) => setIntegrationType(e.target.value as 'manual' | 'api' | 'shared_db')}
            >
              <option value="manual">Manual — MCP stores credentials only</option>
              <option value="api">API — Future: update via website API</option>
              <option value="shared_db">Shared DB — Future: update via shared database</option>
            </select>
          </div>
        </div>

        {/* Save */}
        <div className={styles.formActions}>
          <button type="button" className={styles.cancelBtn} onClick={() => navigate('/restaurants')}>
            Cancel
          </button>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Website Credentials'}
          </button>
        </div>

        <p className={styles.securityNote}>
          🔒 Password visibility is available only to authorized MCP admins.
        </p>
      </form>
    </div>
  );
}
