import { useEffect, useState } from 'react';
import { fetchRestaurants, fetchAllOrders } from '../services/api';
import { Restaurant, Order } from '../types';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchRestaurants(), fetchAllOrders({ limit: 20 })])
      .then(([r, o]) => {
        setRestaurants(r.restaurants);
        setOrders(o.orders);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeRestaurants = restaurants.filter((r) => r.isActive).length;
  const totalOrders = orders.length;

  if (loading) return <div className={styles.loading}>Loading dashboard...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Dashboard</h1>

      {/* Summary cards */}
      <div className={styles.statsGrid}>
        <StatCard icon="🏪" label="Total Restaurants" value={restaurants.length} />
        <StatCard icon="✅" label="Active Restaurants" value={activeRestaurants} color="green" />
        <StatCard icon="📋" label="Recent Paid Orders" value={totalOrders} color="blue" />
        <StatCard
          icon="⏸️"
          label="Inactive Restaurants"
          value={restaurants.length - activeRestaurants}
          color="gray"
        />
      </div>

      {/* Recent orders */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Paid Orders</h2>
        {orders.length === 0 ? (
          <p className={styles.empty}>No orders found. Make sure restaurants are configured and active.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Restaurant</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Pickup</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>#{order.orderNumber}</strong></td>
                    <td>{order.restaurantName}</td>
                    <td>{order.customerName || '—'}</td>
                    <td>
                      {order.total != null
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(order.total)
                        : '—'}
                    </td>
                    <td>
                      <span className={`${styles.pickupBadge} ${styles[order.pickupMode]}`}>
                        {order.pickupMode === 'asap' ? 'ASAP' : order.pickupMode === 'scheduled' ? 'Scheduled' : 'Unknown'}
                      </span>
                    </td>
                    <td>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString('en-US', {
                            timeZone: order.restaurantTimezone,
                            month: 'short', day: 'numeric',
                            hour: 'numeric', minute: '2-digit',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restaurant status */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Restaurant Status</h2>
        <div className={styles.restaurantGrid}>
          {restaurants.map((r) => (
            <div key={r._id} className={`${styles.restaurantCard} ${!r.isActive ? styles.inactive : ''}`}>
              <div className={styles.restaurantHeader}>
                <span className={styles.restaurantName}>{r.name}</span>
                <span className={`${styles.statusDot} ${r.isActive ? styles.active : styles.inactiveDot}`} />
              </div>
              <span className={styles.restaurantKey}>{r.restaurantKey}</span>
              <span className={styles.restaurantTz}>{r.timezone}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, color = 'red',
}: {
  icon: string; label: string; value: number; color?: string;
}) {
  return (
    <div className={`${styles.statCard} ${styles[`stat_${color}`]}`}>
      <span className={styles.statIcon}>{icon}</span>
      <div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}
