import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { PATHS } from '@/routes/paths';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
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

export function DashboardLayout() {
  const { t } = useTranslation();
  const { user, logout, displayName, initials } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const sidebarItems = [
    { labelKey: 'nav.workspaces', icon: LayoutDashboard, href: PATHS.WORKSPACES },
    { labelKey: 'nav.documents', icon: FolderOpen, href: PATHS.DOCUMENTS },
    { labelKey: 'nav.lessonPlanner', icon: Brain, href: PATHS.LESSON_PLANNER },
    { labelKey: 'nav.quizGenerator', icon: FileText, href: PATHS.QUIZ_GENERATOR },
    { labelKey: 'nav.history', icon: History, href: PATHS.HISTORY },
  ];

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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 transition-transform duration-200 group-hover:scale-110">
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold gradient-text">
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
              const isActive =
                location.pathname === item.href ||
                location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="flex-shrink-0 p-4 pt-0 space-y-1">
            <Link
              to={PATHS.SETTINGS.ROOT}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                location.pathname.startsWith(PATHS.SETTINGS.ROOT)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Settings className="w-5 h-5" />
              {t('nav.settings')}
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

            {/* Language switcher */}
            <LanguageSwitcher />

            {/* User menu */}
            <div className="relative ml-2">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-primary">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    {user?.role?.toLowerCase() || t('dashboard.user')}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-lg shadow-lg z-50 animate-fade-in">
                    <div className="p-2">
                      <Link
                        to={PATHS.SETTINGS.ROOT}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        {t('dashboard.userMenu.accountSettings')}
                      </Link>
                      <div className="border-t border-border my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-destructive"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('dashboard.userMenu.logout')}
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
