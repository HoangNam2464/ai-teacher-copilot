import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PATHS } from '@/routes/paths';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  FileText,
  Brain,
  History,
  BrainCircuit,
  FolderOpen,
} from 'lucide-react';

const sidebarItems = [
  { label: 'Workspaces', icon: LayoutDashboard, href: PATHS.WORKSPACES },
  { label: 'Tài Liệu', icon: FolderOpen, href: PATHS.DOCUMENTS },
  { label: 'Soạn Giáo Án', icon: Brain, href: PATHS.LESSON_PLANNER },
  { label: 'Tạo Đề Thi', icon: FileText, href: PATHS.QUIZ_GENERATOR },
  { label: 'Lịch Sử', icon: History, href: PATHS.HISTORY },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col transform transition-transform duration-200 lg:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex-shrink-0 flex items-center justify-between px-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-transform group-hover:scale-110">
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
              AI Teacher Copilot
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="flex-shrink-0 p-4 pt-0 space-y-3">
            <Link
              to="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Settings className="w-5 h-5" />
              Cài đặt
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border sticky top-0 z-30">
          <div className="h-full px-4 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1" />

            {/* User menu */}
            <div className="relative ml-2">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-emerald-600">
                    {user?.fullName?.charAt(0).toUpperCase() || 'T'}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">{user?.fullName || 'Giáo viên'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role || 'Teacher'}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Dropdown menu */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <Link
                        to="#"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Cài đặt tài khoản
                      </Link>
                      <div className="border-t border-border my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-red-500"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
