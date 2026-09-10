import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  Bell,
  Palette,
  ChevronRight,
  LogOut,
  CreditCard,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { PATHS } from '@/routes/paths';
import { cn } from '@/lib/utils';

const colorStyles = {
  green: { bg: 'bg-green-500/10', text: 'text-green-500' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
};

const settingsSections = [
  {
    labelKey: 'settings.profile',
    descKey: 'settings.profileDesc',
    icon: User,
    href: PATHS.SETTINGS.PROFILE,
    color: 'green',
  },
  {
    labelKey: 'settings.account',
    descKey: 'settings.accountDesc',
    icon: Shield,
    href: PATHS.SETTINGS.ACCOUNT,
    color: 'blue',
  },
  {
    labelKey: 'settings.notifications',
    descKey: 'settings.notificationsDesc',
    icon: Bell,
    href: PATHS.SETTINGS.NOTIFICATIONS,
    color: 'amber',
  },
  {
    labelKey: 'settings.appearance',
    descKey: 'settings.appearanceDesc',
    icon: Palette,
    href: PATHS.SETTINGS.APPEARANCE,
    color: 'purple',
  },
  {
    labelKey: 'settings.subscription',
    descKey: 'settings.subscriptionDesc',
    icon: CreditCard,
    href: PATHS.SETTINGS.SUBSCRIPTION,
    color: 'emerald',
    badge: 'Free',
  },
];

export function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate(PATHS.LOGIN);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
      </motion.div>

      {/* User Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card rounded-2xl border border-border p-5 mb-6 flex items-center gap-4 cursor-pointer hover:border-muted-foreground/30 transition-colors"
        onClick={() => navigate(PATHS.SETTINGS.PROFILE)}
      >
        <div className="relative w-14 h-14 shrink-0">
          <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center overflow-hidden ring-2 ring-background">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user?.displayName || user?.name}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-green-600">
                {(user?.displayName || user?.name || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{user?.displayName || user?.name || 'User'}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(PATHS.SETTINGS.SUBSCRIPTION);
              }}
              className="inline-block px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-xs font-medium capitalize hover:bg-green-500/20 transition-colors"
            >
              {user?.plan || 'Free'} Plan{(!user?.plan || user?.plan === 'free') ? ' — Upgrade' : ''}
            </button>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(PATHS.SETTINGS.PROFILE);
          }}
          className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
          aria-label={t('settings.editProfile')}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Settings Sections */}
      <div className="space-y-2">
        {settingsSections.map((section, idx) => {
          const colors = colorStyles[section.color] || colorStyles.green;
          return (
            <motion.button
              key={section.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.04 }}
              onClick={() => navigate(section.href)}
              className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:border-muted-foreground/30 transition-colors text-left"
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colors.bg)}>
                <section.icon className={cn('w-5 h-5', colors.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{t(section.labelKey)}</p>
                  {section.badge && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400">
                      {section.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{t(section.descKey)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          );
        })}
      </div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <button
          onClick={handleLogout}
          className="w-full bg-card rounded-xl border border-red-500/20 p-4 flex items-center gap-4 hover:bg-red-500/5 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-sm font-medium text-red-500">{t('common.logout')}</p>
        </button>
      </motion.div>

      {/* App Info */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-center text-xs text-muted-foreground mt-6"
      >
        AI Teacher Copilot v1.0.0
      </motion.p>
    </div>
  );
}

export default SettingsPage;
