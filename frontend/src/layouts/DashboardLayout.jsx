import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { PATHS } from '@/routes/paths';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  Brain,
  History,
  BrainCircuit,
  FolderOpen,
  Sparkles,
  Bell,
} from 'lucide-react';

export function DashboardLayout() {
  const { t } = useTranslation();
  const { user, logout, displayName, initials } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const sidebarItems = [
    { labelKey: 'nav.dashboard', icon: LayoutDashboard, href: PATHS.DASHBOARD },
    { labelKey: 'nav.workspaces', icon: FolderOpen, href: PATHS.WORKSPACES },
    { labelKey: 'nav.documents', icon: FileText, href: PATHS.DOCUMENTS },
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
                item.href === PATHS.DASHBOARD
                  ? location.pathname === PATHS.DASHBOARD
                  : location.pathname === item.href || location.pathname.startsWith(item.href + '/');
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
          <div className="flex-shrink-0 p-4 pt-0 space-y-3">
            {/* Upgrade to Pro Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-500/20 mb-2">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm font-semibold text-foreground">
                  {t('dashboard.upgradeBanner.title', 'Upgrade to Pro')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                {t('dashboard.upgradeBanner.unlockDescription', 'Unlock unlimited study sets and AI features')}
              </p>
              <Button
                size="sm"
                className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium rounded-xl text-sm py-2 shadow-sm transition-colors"
                asChild
              >
                <Link to={PATHS.SETTINGS.ROOT} onClick={() => setSidebarOpen(false)}>
                  {t('dashboard.upgradeBanner.upgrade', 'Upgrade')}
                </Link>
              </Button>
            </div>

            {/* Settings link */}
            <Link
              to={PATHS.SETTINGS.ROOT}
              onClick={() => setSidebarOpen(false)}
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

            {/* Right actions: Globe + Bell + Divider + Purple Avatar */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Language switcher */}
              <LanguageSwitcher />

              {/* Notification bell */}
              <button
                onClick={() => navigate(PATHS.SETTINGS.NOTIFICATIONS)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* Vertical divider */}
              <div className="h-6 w-px bg-border mx-1" />

              {/* User avatar menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center text-sm transition-transform hover:scale-105 shadow-sm overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  aria-label="User menu"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span>{initials || user?.displayName?.charAt(0)?.toUpperCase() || 'N'}</span>
                  )}
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 animate-fade-in p-2">
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <Link
                        to={PATHS.SETTINGS.ROOT}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        {t('dashboard.userMenu.accountSettings')}
                      </Link>
                      <Link
                        to={PATHS.WELCOME}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        {t('dashboard.userMenu.tour')}
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
                  </>
                )}
              </div>
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
