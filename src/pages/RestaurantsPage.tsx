import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRestaurants, deleteRestaurant, updateRestaurant } from '../services/api';
import { Restaurant } from '../types';
import styles from './RestaurantsPage.module.css';

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      const { restaurants: list } = await fetchRestaurants();
      setRestaurants(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleToggleActive(r: Restaurant) {
    try {
      await updateRestaurant(r._id, { isActive: !r.isActive });
      setRestaurants((prev) =>
        prev.map((x) => (x._id === r._id ? { ...x, isActive: !r.isActive } : x))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  async function handleDelete(r: Restaurant) {
    if (!confirm(`Delete "${r.name}"? This cannot be undone.`)) return;
    try {
      await deleteRestaurant(r._id);
      setRestaurants((prev) => prev.filter((x) => x._id !== r._id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  if (loading) return <div className={styles.loading}>Loading restaurants...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Restaurants</h1>
        <Link to="/restaurants/new" className={styles.addButton}>
          + Add Restaurant
        </Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {restaurants.length === 0 ? (
        <div className={styles.empty}>
          <p>No restaurants yet.</p>
          <Link to="/restaurants/new" className={styles.addButton}>Add your first restaurant</Link>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Timezone</th>
                <th>DB Name</th>
                <th>Collection</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r._id}>
                  <td><strong>{r.name}</strong></td>
                  <td><code className={styles.code}>{r.restaurantKey}</code></td>
                  <td>{r.timezone}</td>
                  <td><code className={styles.code}>{r.sourceDbName}</code></td>
                  <td><code className={styles.code}>{r.sourceOrderCollection}</code></td>
                  <td>
                    <span className={`${styles.badge} ${r.isActive ? styles.active : styles.inactive}`}>
                      {r.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link to={`/restaurants/${r._id}/edit`} className={styles.btnEdit}>Edit</Link>
                      <Link to={`/restaurants/${r._id}/users`} className={styles.btnUsers}>Users</Link>
                      <Link to={`/restaurants/${r._id}/website-credentials`} className={styles.btnWebsite}>Website Admin</Link>
                      <Link to={`/restaurants/${r._id}/orders`} className={styles.btnOrders}>Orders</Link>
                      <Link to={`/restaurants/${r._id}/customers`} className={styles.btnCustomers}>Customers</Link>
                      <button
                        className={r.isActive ? styles.btnDeactivate : styles.btnActivate}
                        onClick={() => handleToggleActive(r)}
                      >
                        {r.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className={styles.btnDelete} onClick={() => handleDelete(r)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
