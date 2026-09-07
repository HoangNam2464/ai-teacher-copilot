import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { ArrowLeft, Sun, Moon, Monitor, Check } from 'lucide-react';
import { PATHS } from '@/routes/paths';

function getStoredTheme() {
  return localStorage.getItem('vite-ui-theme') || 'system';
}

function applyTheme(theme) {
  const root = window.document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }

  localStorage.setItem('vite-ui-theme', theme);
}

const THEME_OPTIONS = [
  {
    value: 'light',
    labelKey: 'appearanceSettingsPage.light',
    descKey: 'appearanceSettingsPage.lightDesc',
    icon: Sun,
    preview: 'bg-white border-gray-200',
  },
  {
    value: 'dark',
    labelKey: 'appearanceSettingsPage.dark',
    descKey: 'appearanceSettingsPage.darkDesc',
    icon: Moon,
    preview: 'bg-gray-900 border-gray-700',
  },
  {
    value: 'system',
    labelKey: 'appearanceSettingsPage.system',
    descKey: 'appearanceSettingsPage.systemDesc',
    icon: Monitor,
    preview: 'bg-gradient-to-r from-white to-gray-900 border-gray-400',
  },
];

export function AppearanceSettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [theme, setTheme] = useState(getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  return (
    <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <Button variant="ghost" size="sm" onClick={() => navigate(PATHS.SETTINGS.ROOT)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('appearanceSettingsPage.back', 'Quay lại')}
          </Button>
          <h1 className="text-2xl font-bold">{t('appearanceSettingsPage.title', 'Giao diện')}</h1>
        </motion.div>

        {/* Theme Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <label className="block text-sm font-semibold mb-4">{t('appearanceSettingsPage.theme', 'Chủ đề')}</label>
          <div className="grid grid-cols-3 gap-4">
            {THEME_OPTIONS.map((opt) => {
              const active = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                    active
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  {active && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}

                  {/* Preview box */}
                  <div className={`w-16 h-10 rounded-lg border-2 ${opt.preview}`} />

                  <opt.icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-center">
                    <p className={`text-sm font-medium ${active ? 'text-primary' : ''}`}>{t(opt.labelKey, opt.value === 'light' ? 'Sáng' : opt.value === 'dark' ? 'Tối' : 'Hệ thống')}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t(opt.descKey, '')}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xs text-muted-foreground text-center mt-6"
        >
          {t('appearanceSettingsPage.themeInfo', 'Chủ đề được lưu trữ trên trình duyệt này.')}
        </motion.p>
      </div>
  );
}
