import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { User, Shield, Bell, Palette, ChevronRight, LogOut, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { PATHS } from '@/routes/paths';

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
    labelKey: 'settings.tour',
    descKey: 'settings.tourDesc',
    icon: Sparkles,
    href: PATHS.WELCOME,
    color: 'emerald',
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
    <div className="max-w-2xl mx-auto py-8">
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
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-background">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-primary">
                  {user?.displayName?.charAt(0).toUpperCase() || 'T'}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{user?.displayName || t('dashboard.user')}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium capitalize">
                {t('settings.workspaceBadge')}
              </span>
            </div>
          </div>
          <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-2">
          {settingsSections.map((section, idx) => (
            <motion.button
              key={section.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.04 }}
              onClick={() => navigate(section.href)}
              className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:border-muted-foreground/30 transition-colors text-left"
            >
              <div className={`w-10 h-10 rounded-xl bg-${section.color}-500/10 flex items-center justify-center shrink-0`}>
                <section.icon className={`w-5 h-5 text-${section.color}-500`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t(section.labelKey)}</p>
                <p className="text-xs text-muted-foreground">{t(section.descKey)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          ))}
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
            className="w-full bg-card rounded-xl border border-destructive/20 p-4 flex items-center gap-4 hover:bg-destructive/5 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-sm font-medium text-destructive">{t('common.logout')}</p>
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
