import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from '@/components/NotificationBell';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { cn } from '@/lib/utils';
import { PATHS } from '@/routes/paths';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  CreditCard,
  Sparkles,
  FileText,
  Brain,
  History,
  BrainCircuit,
  FolderOpen,
  ChevronDown,
  Check,
  Plus,
} from 'lucide-react';

export function DashboardLayout({ children }) {
  const { t } = useTranslation();
  const { user, logout, displayName, initials } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace, fetchWorkspaces } = useWorkspaceStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

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
    navigate(PATHS.LOGIN);
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

        {/* Scrollable area: nav + bottom items */}
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
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400 font-medium'
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
            {/* Pro upgrade banner */}
            {(!user?.plan || user?.plan === 'free') && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">{t('common.upgradeToPro')}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {t('dashboard.upgradeBanner.unlockDescription')}
                </p>
                <Button size="sm" className="w-full bg-green-500 hover:bg-green-600 text-white font-medium" asChild>
                  <Link to={PATHS.SETTINGS.SUBSCRIPTION} onClick={() => setSidebarOpen(false)}>
                    {t('common.upgrade')}
                  </Link>
                </Button>
              </div>
            )}

            {/* Settings link */}
            <Link
              to={PATHS.SETTINGS.ROOT}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                location.pathname.startsWith(PATHS.SETTINGS.ROOT)
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Settings className="w-5 h-5" />
              {t('common.settings')}
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border sticky top-0 z-30">
          <div className="h-full px-4 flex items-center justify-between gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Workspace Quick Switcher */}
            <div className="relative">
              {activeWorkspace ? (
                <button
                  onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-sm font-medium transition-colors shadow-xs"
                  title={t('workspace.title', 'Không gian làm việc')}
                >
                  <div className="w-5 h-5 rounded bg-green-500/10 flex items-center justify-center text-green-600 flex-shrink-0">
                    <FolderOpen className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate max-w-[130px] sm:max-w-[200px] font-semibold text-xs sm:text-sm">
                    {activeWorkspace.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              ) : (
                <Link
                  to={PATHS.WORKSPACES}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-green-500/50 text-green-600 bg-green-500/5 hover:bg-green-500/10 text-xs sm:text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('workspace.createFirst', 'Chọn Không gian')}</span>
                </Link>
              )}

              {/* Workspace Dropdown */}
              {workspaceDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setWorkspaceDropdownOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-50 p-2 animate-fade-in">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('workspace.title', 'Không gian làm việc')}
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {workspaces.map((w) => {
                        const isSelected = activeWorkspace?.id === w.id;
                        return (
                          <button
                            key={w.id}
                            onClick={() => {
                              setActiveWorkspace(w);
                              setWorkspaceDropdownOpen(false);
                            }}
                            className={cn(
                              'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors text-left',
                              isSelected
                                ? 'bg-green-500/10 text-green-600 font-semibold'
                                : 'hover:bg-muted text-foreground'
                            )}
                          >
                            <div className="truncate min-w-0 pr-2">
                              <p className="truncate">{w.name}</p>
                              {w.subject && (
                                <p className="text-[11px] text-muted-foreground font-normal truncate">
                                  {w.subject} {w.gradeLevel ? `• ${w.gradeLevel}` : ''}
                                </p>
                              )}
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-green-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="border-t border-border mt-2 pt-2">
                      <Link
                        to={PATHS.WORKSPACES}
                        onClick={() => setWorkspaceDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-green-600 hover:bg-green-500/10 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t('workspace.create', 'Quản lý / Tạo không gian mới')}
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1" />

            {/* Header Right Side: Language switcher + Notification bell + Divider + User menu */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Language switcher */}
              <LanguageSwitcher />

              {/* Notification bell */}
              <NotificationBell />

              {/* Vertical divider */}
              <div className="h-6 w-px bg-border mx-2" />

              {/* User avatar menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-bold flex items-center justify-center text-sm sm:text-base transition-transform hover:scale-105 shadow-sm overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
                  aria-label="User menu"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span>{initials || (displayName ? displayName.charAt(0).toUpperCase() : 'N')}</span>
                  )}
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-lg shadow-lg z-50 animate-fade-in">
                      <div className="p-2">
                        <div className="px-3 py-2 border-b border-border mb-1">
                          <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                        <Link
                          to={PATHS.SETTINGS.SUBSCRIPTION}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                        >
                          <CreditCard className="w-4 h-4" />
                          {t('common.subscription')}
                          <span className="ml-auto px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded text-[10px] font-medium capitalize">
                            {user?.plan || 'Free'}
                          </span>
                        </Link>
                        <Link
                          to={PATHS.SETTINGS.ROOT}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          {t('common.settings')}
                        </Link>
                        <div className="border-t border-border my-1" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-red-500"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('common.logout')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
