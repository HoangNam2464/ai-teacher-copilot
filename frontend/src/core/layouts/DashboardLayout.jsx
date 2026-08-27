import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { SIDEBAR_ITEMS } from '../constants/sidebarData';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';
import { PATHS } from '../../app/routes/paths';
import apiClient from '../services/client';
import { ENDPOINTS } from '../services/endpoints';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { activeWorkspace, workspaces, setWorkspaces, setActiveWorkspace } = useWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user workspaces on mount
    async function fetchWorkspaces() {
      try {
        const response = await apiClient.get(ENDPOINTS.WORKSPACES);
        if (response.data && Array.isArray(response.data)) {
          setWorkspaces(response.data);
        }
      } catch (err) {
        console.error('Failed to load workspaces:', err);
      }
    }
    fetchWorkspaces();
  }, [setWorkspaces]);

  const handleLogout = () => {
    logout();
    navigate(PATHS.LOGIN);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span>✨</span>
            <span>Teacher Copilot</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          {SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>👤</span>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {user?.fullName || 'Giáo viên'}
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {user?.email || ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
            AI Teacher Copilot for K-12
          </h2>

          {/* Workspace Quick Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Không gian:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
              value={activeWorkspace?.id || ''}
              onChange={(e) => {
                const selected = workspaces.find((w) => w.id === e.target.value);
                if (selected) setActiveWorkspace(selected);
              }}
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.subject || 'Chung'} - {w.gradeLevel || 'K12'})
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Active Workspace Bar */}
        {activeWorkspace && (
          <div className="workspace-bar">
            <span>
              Đang làm việc tại: <strong>{activeWorkspace.name}</strong> • Môn: {activeWorkspace.subject || 'Chưa đặt'} • Khối lớp: {activeWorkspace.gradeLevel || 'Chưa đặt'}
            </span>
          </div>
        )}

        {/* Page Content Outlet */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
