import React, { useEffect, useRef, useState } from 'react';
import { fetchAllOrders, fetchRestaurants } from '../services/api';
import { Order, Restaurant } from '../types';
import styles from './LiveOrdersPage.module.css';

const AUTO_REFRESH_MS = 30_000;

export default function LiveOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Filters
  const [filterRestaurant, setFilterRestaurant] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    setError('');
    try {
      const { orders: list } = await fetchAllOrders({
        limit: 100,
        restaurantId: filterRestaurant || undefined,
        search: filterSearch || undefined,
        fromDate: filterFrom || undefined,
        toDate: filterTo || undefined,
      });
      setOrders(list);
      setLastRefresh(new Date());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRestaurants()
      .then(({ restaurants: list }) => setRestaurants(list))
      .catch(console.error);
  }, []);

  useEffect(() => {
    load();
    timerRef.current = setInterval(() => load(true), AUTO_REFRESH_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [filterRestaurant, filterSearch, filterFrom, filterTo]);

  function formatMoney(amount: number | null, symbol = '$') {
    if (amount == null) return '—';
    return `${symbol}${Number(amount).toFixed(2)}`;
  }

  function formatTime(dateStr: string | null, tz: string) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      timeZone: tz, month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  }

  function fulfillmentLabel(type: string) {
    if (type === 'pickup') return 'PICK UP';
    if (type === 'delivery') return 'DELIVERY';
    return 'UNKNOWN';
  }

  function fulfillmentClass(type: string) {
    if (type === 'pickup') return styles.pickup;
    if (type === 'delivery') return styles.delivery;
    return styles.unknown;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>📡 Live Orders</h1>
          <p className={styles.subtitle}>
            All paid orders across all restaurants · Auto-refreshes every 30s
            {lastRefresh && ` · Last: ${lastRefresh.toLocaleTimeString()}`}
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={() => load()}>↻ Refresh</button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <select className={styles.select} value={filterRestaurant} onChange={(e) => setFilterRestaurant(e.target.value)}>
          <option value="">All Restaurants</option>
          {restaurants.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>
        <input
          className={styles.searchInput}
          placeholder="Search order # or customer..."
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
        />
        <input className={styles.dateInput} type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} title="From date" />
        <input className={styles.dateInput} type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} title="To date" />
        {(filterRestaurant || filterSearch || filterFrom || filterTo) && (
          <button className={styles.clearBtn} onClick={() => { setFilterRestaurant(''); setFilterSearch(''); setFilterFrom(''); setFilterTo(''); }}>
            Clear
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className={styles.empty}>No paid orders found.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Restaurant</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Pickup</th>
                <th>Order Time</th>
                <th>Total</th>
                <th>Prep</th>
                <th>Ack</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className={styles.clickableRow} onClick={() => setSelectedOrder(order)}>
                  <td><strong>#{order.orderNumber}</strong></td>
                  <td>{order.restaurantName}</td>
                  <td>{order.customerName || '—'}</td>
                  <td>
                    <span className={`${styles.typeBadge} ${fulfillmentClass(order.fulfillmentType)}`}>
                      {fulfillmentLabel(order.fulfillmentType)}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.pickupBadge} ${styles[order.pickupMode]}`}>
                      {order.pickupMode === 'asap' ? 'ASAP' : order.pickupMode === 'scheduled' ? 'Scheduled' : '—'}
                    </span>
                  </td>
                  <td>{formatTime(order.createdAt, order.restaurantTimezone)}</td>
                  <td>{formatMoney(order.total, order.currencySymbol || '$')}</td>
                  <td>{order.prepTimeMinutes ? `${order.prepTimeMinutes} min` : '—'}</td>
                  <td>{order.acknowledgedAt ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <LiveOrderPanel order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}

function LiveOrderPanel({ order, onClose }: { order: Order; onClose: () => void }) {
  const tz = order.restaurantTimezone;
  const sym = order.currencySymbol || '$';

  function fmt(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', {
      timeZone: tz, month: 'short', day: 'numeric',
      year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  }

  function money(n: number | null) {
    if (n == null) return '—';
    return `${sym}${Number(n).toFixed(2)}`;
  }

  return (
    <div className={styles.panelOverlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Order #{order.orderNumber}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.panelBody}>
          <Row label="Restaurant" value={order.restaurantName} />
          <Row label="Order Type" value={order.fulfillmentType === 'pickup' ? '🚶 PICK UP' : order.fulfillmentType === 'delivery' ? '🚚 DELIVERY' : '—'} />
          <Row label="Pickup" value={order.pickupMode === 'asap' ? 'ASAP' : order.pickupMode === 'scheduled' ? `Scheduled: ${fmt(order.pickupTime)}` : '—'} />
          <Row label="Placed" value={fmt(order.createdAt)} />
          <Row label="Payment" value="PAID" />
          {order.orderStatus && <Row label="Order Status" value={order.orderStatus} />}

          {order.orderNote && (
            <>
              <div className={styles.divider} />
              <div className={styles.noteBox}>
                <p className={styles.noteLabel}>ORDER NOTE</p>
                <p className={styles.noteText}>{order.orderNote}</p>
              </div>
            </>
          )}

          <div className={styles.divider} />
          <Row label="Customer" value={order.customerName || '—'} />
          <Row label="Phone" value={order.customerPhone || '—'} />
          <Row label="Email" value={order.customerEmail || '—'} />

          <div className={styles.divider} />
          <p className={styles.itemsTitle}>Items</p>
          {(order.items as Array<{ name?: string; quantity?: number; price?: number }>).map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <span>{item.quantity ? `${item.quantity}x ` : ''}{item.name || 'Item'}</span>
              {item.price != null && <span>{money(item.price)}</span>}
            </div>
          ))}

          <div className={styles.divider} />
          {order.subtotal != null && <Row label="Subtotal" value={money(order.subtotal)} />}
          {order.tax != null && <Row label="Tax" value={money(order.tax)} />}
          {order.deliveryFee != null && <Row label="Delivery Fee" value={money(order.deliveryFee)} />}
          {order.tip != null && <Row label="Tip" value={money(order.tip)} />}
          <Row label="Total" value={money(order.total)} />

          {order.prepTimeMinutes != null && (
            <>
              <div className={styles.divider} />
              <Row label="Prep Time" value={order.customPrepTimeLabel || `${order.prepTimeMinutes} min`} />
            </>
          )}
          {order.acknowledgedAt && <Row label="Acknowledged" value={fmt(order.acknowledgedAt)} />}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}
