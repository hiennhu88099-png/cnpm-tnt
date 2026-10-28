import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const AUTH_PATHS = ['/login', '/register'];

export default function Layout() {
  const { pathname } = useLocation();
  const isAuthPage = AUTH_PATHS.includes(pathname);

  return (
    <div className="app-shell">
      {!isAuthPage && <Navbar />}
      <main className="app-main">
        <Outlet />
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}
