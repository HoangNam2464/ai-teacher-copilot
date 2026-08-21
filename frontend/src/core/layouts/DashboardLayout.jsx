import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { SIDEBAR_ITEMS } from '../constants/sidebarData';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';
import { PATHS } from '../../app/routes/paths';
import apiClient from '../services/client';
import { ENDPOINTS } from '../services/endpoints';
import {
  IconSparkles,
  IconDashboard,
  IconSchool,
  IconBookOpen,
  IconFileText,
  IconTarget,
  IconClock,
  IconUser,
  IconLogOut,
} from '../components/icons/SvgIcons';

function getSidebarIcon(iconName) {
  switch (iconName) {
    case 'dashboard':
      return <IconDashboard size={18} />;
    case 'workspaces':
      return <IconSchool size={18} />;
    case 'documents':
      return <IconBookOpen size={18} />;
    case 'lesson-planner':
      return <IconFileText size={18} />;
    case 'quiz-generator':
      return <IconTarget size={18} />;
    case 'history':
      return <IconClock size={18} />;
    default:
      return <IconFileText size={18} />;
  }
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { activeWorkspace, workspaces, setWorkspaces, setActiveWorkspace } = useWorkspace();
  const navigate = useNavigate();

  useEffect(() => {

    async function fetchWorkspaces() {
      try {
        const response = await apiClient.get(ENDPOINTS.WORKSPACES);
        const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        if (Array.isArray(list)) {
          setWorkspaces(list);
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

      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
              <IconSparkles size={22} />
            </span>
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
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {getSidebarIcon(item.iconName)}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconUser size={18} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {user?.fullName || 'Giáo viên'}
              </p>
              <p style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
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
            <IconLogOut size={14} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="main-wrapper">

        <header className="top-header">
          <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', letterSpacing: '-0.01em' }}>
            AI Teacher Copilot for K-12
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
              Không gian:
            </span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: 'var(--font-size-xs)' }}
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

        {activeWorkspace && (
          <div className="workspace-bar">
            <span>
              Đang làm việc tại: <strong>{activeWorkspace.name}</strong> • Môn: {activeWorkspace.subject || 'Chưa đặt'} • Khối lớp: {activeWorkspace.gradeLevel || 'Chưa đặt'}
            </span>
          </div>
        )}

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
