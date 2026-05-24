# Restaurant Order Admin Panel

React + Vite + TypeScript admin dashboard for managing restaurants, users, and orders.

## Quick Start

```bash
cd admin-panel
npm install
npm run dev
```

Opens at http://localhost:5173

The Vite dev server proxies `/api/*` to `http://localhost:5000` automatically.

## First Login

Run the backend seed script first to create the admin account:

```bash
cd ../backend
npm run seed:admin
```

Default credentials (change immediately):
- Email: `admin@restaurant.com`
- Password: `Admin1234!`

## Features

| Page | Path | Description |
|---|---|---|
| Dashboard | `/` | Summary stats + recent orders |
| Restaurants | `/restaurants` | List, create, edit, delete, activate/deactivate |
| Add Restaurant | `/restaurants/new` | Restaurant form with source DB config |
| Edit Restaurant | `/restaurants/:id/edit` | Edit all restaurant fields |
| Restaurant Users | `/restaurants/:id/users` | Create/manage mobile app login accounts |
| All Orders | `/orders` | View paid orders across all restaurants |
| Restaurant Orders | `/restaurants/:id/orders` | Orders filtered by restaurant |

## Building for Production

```bash
npm run build
# Output in dist/
```

Deploy the `dist/` folder to Vercel, Netlify, or any static host.
Set `VITE_API_BASE_URL` to your deployed backend URL.

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend URL (empty = use Vite proxy in dev) |
