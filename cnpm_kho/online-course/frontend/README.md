# Online Course – Frontend

React 19 + Vite + React Router + Axios. Handles register, login (JWT), profile and change password.

## Run

1. Start MySQL (`docker compose up -d` in `online-course/`) and the backend on port 8080 (needs the `JWT_SECRET` env var).
2. In this folder:

```bash
npm install
npm run dev        # http://localhost:5173
```

The backend URL defaults to `http://localhost:8080`; to change it, copy `.env.example` to `.env.local` and edit `VITE_API_BASE_URL`.
The backend only accepts browser requests from origins in `app.cors.allowed-origins` (5173 and 3000 by default).

## Structure

```
src/
  api/client.js        axios instance: adds "Authorization: Bearer <token>", logs out on 401
  api/authApi.js       calls to /api/auth/* and /api/users/me*
  api/apiError.js      reads the backend error format { status, message, errors? }
  auth/AuthContext.jsx AuthProvider: current user, login(), logout(), restores session on reload
  auth/useAuth.js      useAuth() hook
  auth/RouteGuards.jsx ProtectedRoute (needs login) / GuestRoute (login + register pages)
  components/ui/       shared UI components (Button, Card, Alert, CourseCard, ...) — preview at /ui-kit
  components/          Layout, Navbar, Footer, AccountLayout, AuthCard, FormField
  config/site.js       brand name + header / account menus
  styles/              tokens.css (colors, spacing...), base, components, layout, pages
  pages/               Home, Login, Register, Profile, ChangePassword, UiKit, NotFound
```

## Adding a protected page

Put the route inside `<Route element={<ProtectedRoute />}>` in `App.jsx`, and call the API through `client` from `api/client.js`,
so the token is attached and an expired session automatically sends the user back to `/login`.
