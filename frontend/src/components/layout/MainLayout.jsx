import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * Main application layout wrapping authenticated routes.
 */
export default function MainLayout() {
  return (
    <div className="layout-container">
      <Sidebar />
      <div className="layout-content">
        <Header />
        <main className="layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
