import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Lock,
  Trash2,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { PATHS } from '@/routes/paths';

export function AccountSettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  // Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleChangePassword = async () => {
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError(t('accountSettingsPage.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('accountSettingsPage.passwordsDoNotMatch'));
      return;
    }

    setChangingPassword(true);
    try {
      // Mock API call
      await new Promise(r => setTimeout(r, 1500));
      setPasswordChanged(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordChanged(false), 3000);
    } catch {
      setPasswordError(t('accountSettingsPage.incorrectPassword'));
    }
    setChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      // Mock API call
      await new Promise(r => setTimeout(r, 1500));
      logout();
      navigate(PATHS.LOGIN);
    } catch {
      // Silently ignore delete errors for demo
    }
    setDeleting(false);
  };

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
            {t('accountSettingsPage.back')}
          </Button>
          <h1 className="text-2xl font-bold">{t('accountSettingsPage.title')}</h1>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border border-border p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t('accountSettingsPage.changePassword')}</p>
              <p className="text-xs text-muted-foreground">{t('accountSettingsPage.changePasswordDesc')}</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Old password */}
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder={t('accountSettingsPage.currentPassword')}
                className="w-full px-4 py-3 pr-10 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* New password */}
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('accountSettingsPage.newPassword')}
                className="w-full px-4 py-3 pr-10 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm */}
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('accountSettingsPage.confirmNewPassword')}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />

            {passwordError && (
              <p className="text-xs text-destructive">{passwordError}</p>
            )}

            {passwordChanged && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <Check className="w-3 h-3" /> {t('accountSettingsPage.passwordChangedSuccess')}
              </p>
            )}

            <Button
              onClick={handleChangePassword}
              disabled={!oldPassword || !newPassword || !confirmPassword || changingPassword}
              className="bg-blue-500 hover:bg-blue-600 h-11 w-full"
            >
              {changingPassword ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {changingPassword ? t('accountSettingsPage.changing') : t('accountSettingsPage.changePasswordBtn')}
            </Button>
          </div>
        </motion.div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-6 mb-6"
        >
          <p className="text-sm font-semibold mb-3">{t('accountSettingsPage.accountInfo')}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">{t('accountSettingsPage.emailLabel')}</span>
              <span>{user?.email || 'user@example.com'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">{t('accountSettingsPage.planLabel')}</span>
              <span className="capitalize text-primary font-medium">{t('dashboard.user')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">{t('accountSettingsPage.emailVerified')}</span>
              <span className="text-green-500">{t('accountSettingsPage.yes')}</span>
            </div>
          </div>
        </motion.div>

        {/* Delete Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl border border-destructive/20 p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-destructive">{t('accountSettingsPage.deleteAccount')}</p>
              <p className="text-xs text-muted-foreground">{t('accountSettingsPage.deleteAccountDesc')}</p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-destructive border-destructive/30 hover:bg-destructive/5"
            >
              {t('accountSettingsPage.deleteMyAccount')}
            </Button>
          ) : (
            <div className="space-y-3 p-4 bg-destructive/5 rounded-xl border border-destructive/20 mt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">{t('accountSettingsPage.cannotBeUndone')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('accountSettingsPage.deleteWarning')}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <label className="text-xs text-muted-foreground mb-2 block" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('accountSettingsPage.typeDeleteToConfirm')) }} />
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 bg-background border border-destructive/30 rounded-lg text-sm focus:outline-none"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  {deleting ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  {deleting ? t('accountSettingsPage.deleting') : t('accountSettingsPage.deleteForever')}
                </Button>
                <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}>
                  {t('accountSettingsPage.cancel')}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
  );
}
