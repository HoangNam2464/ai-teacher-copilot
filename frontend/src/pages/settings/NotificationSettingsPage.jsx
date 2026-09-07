import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Check } from 'lucide-react';
import { PATHS } from '@/routes/paths';

const DEFAULT_PREFS = {
  enabled: true,
  documentProcessing: true,
  securityAlerts: true,
  productUpdates: false,
};

const NOTIFICATION_TYPES = [
  {
    key: 'documentProcessing',
    labelKey: 'notificationSettingsPage.documentProcessing',
    defaultLabel: 'Xử lý tài liệu',
    descKey: 'notificationSettingsPage.documentProcessingDesc',
    defaultDesc: 'Thông báo khi tài liệu của bạn đã được AI xử lý xong',
  },
  {
    key: 'securityAlerts',
    labelKey: 'notificationSettingsPage.securityAlerts',
    defaultLabel: 'Cảnh báo bảo mật',
    descKey: 'notificationSettingsPage.securityAlertsDesc',
    defaultDesc: 'Cảnh báo về các đăng nhập bất thường hoặc thay đổi tài khoản',
  },
  {
    key: 'productUpdates',
    labelKey: 'notificationSettingsPage.productUpdates',
    defaultLabel: 'Cập nhật sản phẩm',
    descKey: 'notificationSettingsPage.productUpdatesDesc',
    defaultDesc: 'Tin tức về các tính năng và cải tiến mới',
  },
];

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? 'bg-primary' : 'bg-muted'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function NotificationSettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        // Mock API call
        await new Promise((r) => setTimeout(r, 500));
        setPrefs(DEFAULT_PREFS);
      } catch {
        // Silently ignore fetch errors
      }
      setLoading(false);
    };
    loadPrefs();
  }, []);

  const updatePref = (key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Mock API call
      await new Promise((r) => setTimeout(r, 1500));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Silently ignore save errors for demo
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

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
            {t('notificationSettingsPage.back', 'Quay lại')}
          </Button>
          <h1 className="text-2xl font-bold">{t('notificationSettingsPage.title', 'Tùy Chọn Thông Báo')}</h1>
        </motion.div>

        {/* Master Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border border-border p-5 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t('notificationSettingsPage.allNotifications', 'Tất cả Thông Báo')}</p>
                <p className="text-xs text-muted-foreground">{t('notificationSettingsPage.masterToggle', 'Bật hoặc tắt tất cả thông báo')}</p>
              </div>
            </div>
            <Toggle checked={prefs.enabled} onChange={(val) => updatePref('enabled', val)} />
          </div>
        </motion.div>

        {/* Individual Toggles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border divide-y divide-border"
        >
          {NOTIFICATION_TYPES.map((type) => (
            <div key={type.key} className="flex items-center justify-between p-5">
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-medium">{t(type.labelKey, type.defaultLabel)}</p>
                <p className="text-xs text-muted-foreground">{t(type.descKey, type.defaultDesc)}</p>
              </div>
              <Toggle
                checked={prefs[type.key]}
                onChange={(val) => updatePref(type.key, val)}
                disabled={!prefs.enabled}
              />
            </div>
          ))}
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6"
        >
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12"
          >
            {saving ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : saved ? (
              <Check className="w-5 h-5 mr-2" />
            ) : null}
            {saving ? t('notificationSettingsPage.saving', 'Đang lưu...') : saved ? t('notificationSettingsPage.saved', 'Đã lưu!') : t('notificationSettingsPage.savePreferences', 'Lưu Tùy Chọn')}
          </Button>
        </motion.div>
      </div>
  );
}
