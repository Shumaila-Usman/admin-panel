import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createRestaurant, fetchRestaurant, updateRestaurant } from '../services/api';
import { RestaurantFormData } from '../types';
import styles from './RestaurantFormPage.module.css';

// Timezone options with friendly labels (client requirement)
const TIMEZONES = [
  { label: 'Eastern Time — America/New_York',       value: 'America/New_York' },
  { label: 'Central Time — America/Chicago',        value: 'America/Chicago' },
  { label: 'Mountain Time — America/Denver',        value: 'America/Denver' },
  { label: 'Pacific Time — America/Los_Angeles',    value: 'America/Los_Angeles' },
  { label: 'Arizona — America/Phoenix',             value: 'America/Phoenix' },
  { label: 'Alaska — America/Anchorage',            value: 'America/Anchorage' },
  { label: 'Hawaii — Pacific/Honolulu',             value: 'Pacific/Honolulu' },
  { label: 'Toronto — America/Toronto',             value: 'America/Toronto' },
  { label: 'Vancouver — America/Vancouver',         value: 'America/Vancouver' },
  { label: 'Mexico City — America/Mexico_City',     value: 'America/Mexico_City' },
  { label: 'Australia Sydney — Australia/Sydney',   value: 'Australia/Sydney' },
  { label: 'London — Europe/London',                value: 'Europe/London' },
  { label: 'Paris — Europe/Paris',                  value: 'Europe/Paris' },
  { label: 'Tokyo — Asia/Tokyo',                    value: 'Asia/Tokyo' },
];

const CURRENCY_PRESETS = [
  { code: 'USD', symbol: '$',   label: 'US Dollar (USD $)' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar (CAD CA$)' },
  { code: 'AUD', symbol: 'AU$', label: 'Australian Dollar (AUD AU$)' },
  { code: 'MXN', symbol: 'MXN', label: 'Mexican Peso (MXN)' },
  { code: 'GBP', symbol: '£',   label: 'British Pound (GBP £)' },
  { code: 'EUR', symbol: '€',   label: 'Euro (EUR €)' },
];

const DEFAULT_FORM: RestaurantFormData = {
  name: '',
  restaurantKey: '',
  timezone: 'America/New_York',
  currencyCode: 'USD',
  currencySymbol: '$',
  sourceDbUri: '',
  sourceDbName: '',
  sourceOrderCollection: 'orders',
  sourcePaymentStatusField: 'paymentStatus',
  sourcePaidValue: 'paid',
  sourceOrderNumberField: 'orderNumber',
  sourceOrderTypeField: 'orderType',
  sourceItemsField: 'items',
  sourceOrderNoteField: '',
  sourceFulfillmentTypeField: '',
  isActive: true,
  printerEnabled: false,
  printerNotes: '',
};

export default function RestaurantFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<RestaurantFormData>(DEFAULT_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit || !id) return;
    fetchRestaurant(id)
      .then(({ restaurant: r }) => {
        setForm({
          name: r.name,
          restaurantKey: r.restaurantKey,
          timezone: r.timezone,
          currencyCode: r.currencyCode || 'USD',
          currencySymbol: r.currencySymbol || '$',
          sourceDbUri: r.sourceDbUri,
          sourceDbName: r.sourceDbName,
          sourceOrderCollection: r.sourceOrderCollection,
          sourcePaymentStatusField: r.sourcePaymentStatusField,
          sourcePaidValue: r.sourcePaidValue,
          sourceOrderNumberField: r.sourceOrderNumberField,
          sourceOrderTypeField: r.sourceOrderTypeField,
          sourceItemsField: r.sourceItemsField,
          sourceOrderNoteField: r.sourceOrderNoteField || '',
          sourceFulfillmentTypeField: r.sourceFulfillmentTypeField || '',
          isActive: r.isActive,
          printerEnabled: r.printerEnabled || false,
          printerNotes: r.printerNotes || '',
        });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function set(field: keyof RestaurantFormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleNameChange(value: string) {
    set('name', value);
    if (!isEdit) {
      set('restaurantKey', value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  }

  function handleCurrencyPreset(code: string) {
    const preset = CURRENCY_PRESETS.find((p) => p.code === code);
    if (preset) {
      set('currencyCode', preset.code);
      set('currencySymbol', preset.symbol);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit && id) {
        await updateRestaurant(id, form);
      } else {
        await createRestaurant(form);
      }
      navigate('/restaurants');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/restaurants')}>← Back</button>
        <h1 className={styles.pageTitle}>{isEdit ? 'Edit Restaurant' : 'Add Restaurant'}</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Basic Info */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic Info</h2>
          <div className={styles.grid2}>
            <Field label="Restaurant Name *" required>
              <input className={styles.input} value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
            </Field>
            <Field label="Restaurant Key *" hint="Unique slug, lowercase, no spaces" required>
              <input className={styles.input} value={form.restaurantKey} onChange={(e) => set('restaurantKey', e.target.value.toLowerCase())} required pattern="[a-z0-9\-]+" />
            </Field>
            <Field label="Timezone *">
              <select className={styles.input} value={form.timezone} onChange={(e) => set('timezone', e.target.value)}>
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Active">
              <label className={styles.toggle}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
                <span>{form.isActive ? 'Active' : 'Inactive'}</span>
              </label>
            </Field>
          </div>
        </section>

        {/* Currency */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Currency</h2>
          <p className={styles.hint}>Set the local currency for this restaurant. Shown in mobile app and admin orders.</p>
          <div className={styles.grid2}>
            <Field label="Currency Preset">
              <select
                className={styles.input}
                value={form.currencyCode}
                onChange={(e) => handleCurrencyPreset(e.target.value)}
              >
                {CURRENCY_PRESETS.map((p) => (
                  <option key={p.code} value={p.code}>{p.label}</option>
                ))}
                <option value="">Custom...</option>
              </select>
            </Field>
            <Field label="Currency Code" hint="e.g. USD, CAD, AUD, MXN">
              <input className={styles.input} value={form.currencyCode} onChange={(e) => set('currencyCode', e.target.value.toUpperCase())} placeholder="USD" />
            </Field>
            <Field label="Currency Symbol" hint="e.g. $, CA$, AU$, MXN">
              <input className={styles.input} value={form.currencySymbol} onChange={(e) => set('currencySymbol', e.target.value)} placeholder="$" />
            </Field>
          </div>
        </section>

        {/* Source DB */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Source Database Connection</h2>
          <p className={styles.hint}>
            This is the restaurant's own MongoDB Atlas database where their website orders are stored.
            The mobile app never connects here — only the backend does.
          </p>
          <div className={styles.grid1}>
            <Field label="Source DB URI *" hint="Full MongoDB Atlas connection string (stored securely)">
              <input
                className={styles.input}
                type="password"
                value={form.sourceDbUri}
                onChange={(e) => set('sourceDbUri', e.target.value)}
                placeholder="mongodb+srv://user:pass@cluster.mongodb.net"
                required
              />
            </Field>
          </div>
          <div className={styles.grid2}>
            <Field label="Database Name *" hint="The database name inside their Atlas cluster">
              <input className={styles.input} value={form.sourceDbName} onChange={(e) => set('sourceDbName', e.target.value)} required placeholder="restaurant_db" />
            </Field>
            <Field label="Orders Collection" hint="Collection that holds orders">
              <input className={styles.input} value={form.sourceOrderCollection} onChange={(e) => set('sourceOrderCollection', e.target.value)} placeholder="orders" />
            </Field>
          </div>
        </section>

        {/* Field Mappings */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Pickup Mapping</h2>
          <p className={styles.hint}>
            Map the field names in the source database to standard fields.
            Use the debug endpoint to inspect actual field names.
          </p>
          <div className={styles.grid2}>
            <Field label="Payment Status Field" hint="Field that holds payment status">
              <input className={styles.input} value={form.sourcePaymentStatusField} onChange={(e) => set('sourcePaymentStatusField', e.target.value)} placeholder="paymentStatus" />
            </Field>
            <Field label="Paid Value" hint="The value that means 'paid' (e.g. paid, PAID, completed)">
              <input className={styles.input} value={form.sourcePaidValue} onChange={(e) => set('sourcePaidValue', e.target.value)} placeholder="paid" />
            </Field>
            <Field label="Order Number Field">
              <input className={styles.input} value={form.sourceOrderNumberField} onChange={(e) => set('sourceOrderNumberField', e.target.value)} placeholder="orderNumber" />
            </Field>
            <Field label="Order Type Field">
              <input className={styles.input} value={form.sourceOrderTypeField} onChange={(e) => set('sourceOrderTypeField', e.target.value)} placeholder="orderType" />
            </Field>
            <Field label="Items Field">
              <input className={styles.input} value={form.sourceItemsField} onChange={(e) => set('sourceItemsField', e.target.value)} placeholder="items" />
            </Field>
            <Field label="Fulfillment Type Field" hint="Field for PICK UP / DELIVERY detection (optional)">
              <input className={styles.input} value={form.sourceFulfillmentTypeField} onChange={(e) => set('sourceFulfillmentTypeField', e.target.value)} placeholder="fulfillmentType" />
            </Field>
            <Field label="Order Note Field" hint="Field for customer order note (optional, e.g. customerNote)">
              <input className={styles.input} value={form.sourceOrderNoteField} onChange={(e) => set('sourceOrderNoteField', e.target.value)} placeholder="notes" />
            </Field>
          </div>
        </section>

        {/* Printer — future feature, disabled by default */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Bluetooth Printer{' '}
            <span style={{ fontSize: 11, background: '#fff8e1', color: '#f57f17', borderRadius: 4, padding: '2px 8px', fontWeight: 700, letterSpacing: 0.5 }}>
              BETA — NOT READY
            </span>
          </h2>
          <p className={styles.hint}>
            Printer integration is pending client confirmation. Enable only after printer model is confirmed and integration is built.
            Do not enable for production use until a compatible library is installed.
          </p>
          <div className={styles.grid2}>
            <Field label="Printer Enabled">
              <label className={styles.toggle}>
                <input type="checkbox" checked={form.printerEnabled} onChange={(e) => set('printerEnabled', e.target.checked)} />
                <span>{form.printerEnabled ? 'Enabled (Beta)' : 'Disabled (default)'}</span>
              </label>
            </Field>
            <Field label="Printer Notes" hint="e.g. printer brand, model, paper width — for developer reference">
              <input
                className={styles.input}
                value={form.printerNotes}
                onChange={(e) => set('printerNotes', e.target.value)}
                placeholder="e.g. GOOJPRT PT-210, 58mm, ESC/POS"
              />
            </Field>
          </div>
        </section>

        <div className={styles.formFooter}>
          <button type="button" className={styles.cancelBtn} onClick={() => navigate('/restaurants')}>Cancel</button>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Restaurant'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}{required && <span className={styles.required}> *</span>}
      </label>
      {children}
      {hint && <span className={styles.fieldHint}>{hint}</span>}
    </div>
  );
}
