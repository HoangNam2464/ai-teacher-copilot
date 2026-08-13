import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-search">
        {/* Placeholder for global search or workspace selector */}
        <span className="badge">Phase 1 Foundation</span>
      </div>
      <div className="header-actions">
        <div className="user-profile">
          <span className="user-avatar">T</span>
          <span>Teacher</span>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>
    </header>
  );
}
