import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAllOrders, fetchRestaurantOrders, fetchRestaurants } from '../services/api';
import { Order, Restaurant } from '../types';
import styles from './OrdersPage.module.css';

export default function OrdersPage() {
  // If restaurantId param is present, show orders for that restaurant only
  const { restaurantId } = useParams<{ restaurantId?: string }>();

  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(restaurantId || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchRestaurants()
      .then(({ restaurants: list }) => setRestaurants(list))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    const promise = selectedRestaurant
      ? fetchRestaurantOrders(selectedRestaurant, 100)
      : fetchAllOrders({ limit: 100 });

    promise
      .then(({ orders: list }) => setOrders(list))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [selectedRestaurant]);

  function formatMoney(amount: number | null, currency = 'USD') {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  }

  function formatTime(dateStr: string | null, tz: string) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      timeZone: tz,
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>
          {restaurantId ? 'Restaurant Orders' : 'All Paid Orders'}
        </h1>
        <div className={styles.filters}>
          <select
            className={styles.select}
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
          >
            <option value="">All Restaurants</option>
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>
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
                <th>Status</th>
                <th>Type</th>
                <th>Pickup</th>
                <th>Total</th>
                <th>Placed</th>
                <th>Prep</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className={styles.clickableRow}
                  onClick={() => setSelectedOrder(order)}
                >
                  <td><strong>#{order.orderNumber}</strong></td>
                  <td>{order.restaurantName}</td>
                  <td>{order.customerName || '—'}</td>
                  <td>
                    <span className={`${styles.badge} ${styles.paid}`}>PAID</span>
                    {order.orderStatus && (
                      <span className={`${styles.badge} ${styles.status}`}>
                        {order.orderStatus}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.typeBadge} ${order.fulfillmentType === 'pickup' ? styles.pickup : order.fulfillmentType === 'delivery' ? styles.delivery : styles.unknown}`}>
                      {order.fulfillmentType === 'pickup' ? 'PICK UP' : order.fulfillmentType === 'delivery' ? 'DELIVERY' : '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.pickupBadge} ${styles[order.pickupMode]}`}>
                      {order.pickupMode === 'asap' ? 'ASAP' : order.pickupMode === 'scheduled' ? 'Scheduled' : 'Unknown'}
                    </span>
                  </td>
                  <td>{formatMoney(order.total, order.currency)}</td>
                  <td>{formatTime(order.createdAt, order.restaurantTimezone)}</td>
                  <td>{order.prepTimeMinutes ? `${order.prepTimeMinutes} min` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order detail side panel */}
      {selectedOrder && (
        <OrderDetailPanel order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}

function OrderDetailPanel({ order, onClose }: { order: Order; onClose: () => void }) {
  const tz = order.restaurantTimezone;

  function fmt(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', {
      timeZone: tz, month: 'short', day: 'numeric',
      year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  }

  function money(n: number | null) {
    if (n == null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(n);
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
          <Row label="Timezone" value={tz} />
          <Row label="Payment" value={<span className={`${styles.badge} ${styles.paid}`}>PAID</span>} />
          {order.orderStatus && <Row label="Order Status" value={order.orderStatus} />}
          <Row label="Placed" value={fmt(order.createdAt)} />
          <Row label="Pickup" value={
            order.pickupMode === 'asap' ? 'ASAP' :
            order.pickupMode === 'scheduled' ? `Scheduled: ${fmt(order.pickupTime)}` : 'Unknown'
          } />

          {(order.orderNote || order.notes) && (
            <>
              <div className={styles.divider} />
              <div style={{ background: '#fff8e1', borderLeft: '4px solid #f57f17', borderRadius: 6, padding: '10px 14px', margin: '4px 0' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#f57f17', margin: '0 0 4px' }}>ORDER NOTE</p>
                <p style={{ fontSize: 14, color: '#1a1a1a', margin: 0 }}>{order.orderNote || order.notes}</p>
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
          <Row label="Total" value={<strong>{money(order.total)}</strong>} />

          {order.prepTimeMinutes && (
            <>
              <div className={styles.divider} />
              <Row label="Prep Time" value={`${order.prepTimeMinutes} min`} />
            </>
          )}
          {order.acknowledgedAt && (
            <Row label="Acknowledged" value={fmt(order.acknowledgedAt)} />
          )}
          {order.notes && (
            <>
              <div className={styles.divider} />
              <p className={styles.itemsTitle}>Notes</p>
              <p className={styles.notes}>{order.notes}</p>
            </>
          )}
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
