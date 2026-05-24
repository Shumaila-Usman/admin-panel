import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRestaurantCustomers, getCustomerExportUrl, fetchRestaurant } from '../services/api';
import { Customer, Restaurant } from '../types';
import styles from './CustomersPage.module.css';

export default function CustomersPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!restaurantId) return;
    Promise.all([
      fetchRestaurant(restaurantId),
      fetchRestaurantCustomers(restaurantId),
    ])
      .then(([{ restaurant: r }, { customers: c }]) => {
        setRestaurant(r);
        setCustomers(c);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [restaurantId]);

  function handleExport() {
    if (!restaurantId) return;
    window.open(getCustomerExportUrl(restaurantId), '_blank');
  }

  if (loading) return <div className={styles.loading}>Loading customers...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/restaurants')}>← Restaurants</button>
        <div>
          <h1 className={styles.pageTitle}>Customers — {restaurant?.name}</h1>
          <p className={styles.subtitle}>Unique customers from paid orders · {customers.length} total</p>
        </div>
        <button className={styles.exportBtn} onClick={handleExport}>⬇ Export CSV</button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {customers.length === 0 ? (
        <div className={styles.empty}>No customer data found. Make sure there are paid orders for this restaurant.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Last Order</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr key={i}>
                  <td><strong>{c.customerName || '—'}</strong></td>
                  <td>{c.customerPhone || '—'}</td>
                  <td>{c.customerEmail || '—'}</td>
                  <td>{c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : '—'}</td>
                  <td>{c.totalOrders}</td>
                  <td>${c.totalSpent.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
