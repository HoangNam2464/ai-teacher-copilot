import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CreditCard,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { PATHS } from '@/routes/paths';

/**
 * SubscriptionPage
 * Bám sát khuôn mẫu giao diện manageSubscriptionPage từ frontend1
 * Tối giản, không thêm chi tiết thừa thãi, đồng bộ trạng thái gói với authStore.
 */
export function SubscriptionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const isPro = user?.plan === 'pro';

  // Nâng cấp trực tiếp lên Pro theo logic chuẩn của authStore
  const handleUpgradeToPro = () => {
    updateUser({ plan: 'pro' });
    toast.success(
      t('manageSubscriptionPage.upgradeSuccess', {
        defaultValue: 'Nâng cấp thành công! Tài khoản của bạn đã chuyển sang gói Pro.',
      })
    );
  };

  // Hủy đăng ký / Chuyển về gói Free
  const handleDowngradeToFree = () => {
    updateUser({ plan: 'free' });
    toast.info(
      t('manageSubscriptionPage.cancelSuccess', {
        defaultValue: 'Tài khoản của bạn đã chuyển về gói Free.',
      })
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(PATHS.SETTINGS.ROOT)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('manageSubscriptionPage.backToPlans', { defaultValue: 'Quay lại' })}
        </Button>
        <h1 className="text-2xl font-bold">
          {t('manageSubscriptionPage.title', { defaultValue: 'Quản lý Đăng ký' })}
        </h1>
      </motion.div>

      {/* Card 1: Gói hiện tại */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card rounded-2xl border border-border p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {t('manageSubscriptionPage.plan', {
                name: isPro ? 'Pro' : 'Free',
                defaultValue: isPro ? 'Gói Pro' : 'Gói Free',
              })}
            </p>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${
                isPro
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('manageSubscriptionPage.active', { defaultValue: 'Đang hoạt động' })}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">
              {t('manageSubscriptionPage.currentPeriod', { defaultValue: 'Thời gian hiện tại' })}
            </span>
            <span className="font-medium">
              {isPro
                ? t('manageSubscriptionPage.monthlyPeriod', { defaultValue: 'Hàng tháng' })
                : t('manageSubscriptionPage.freeForever', { defaultValue: 'Miễn phí' })}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">
              {t('manageSubscriptionPage.nextBilling', { defaultValue: 'Hóa đơn tiếp theo' })}
            </span>
            <span className="font-medium">
              {isPro
                ? t('manageSubscriptionPage.autoRenew', { defaultValue: 'Tự động gia hạn hàng tháng' })
                : t('manageSubscriptionPage.noRenewal', { defaultValue: 'Không gia hạn — gói cơ bản miễn phí' })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Card 2: Thay đổi gói / Nâng cấp */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border p-6 mb-6"
      >
        {!isPro ? (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {t('manageSubscriptionPage.readyToUpgrade', { defaultValue: 'Sẵn sàng nâng cấp lên Pro?' })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('manageSubscriptionPage.upgradeDescription', {
                    defaultValue: 'Mở rộng tính năng AI và lưu trữ không giới hạn với gói trả phí.',
                  })}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-end">
              <Button
                onClick={handleUpgradeToPro}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-10 px-5"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {t('common.upgradeToPro', { defaultValue: 'Nâng cấp lên Pro' })}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {t('manageSubscriptionPage.cancelSubscription', { defaultValue: 'Hủy Đăng ký' })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('manageSubscriptionPage.keepAccessUntilEnd', {
                    defaultValue: 'Bạn sẽ giữ quyền truy cập cho đến cuối kỳ.',
                  })}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-end">
              <Button
                variant="outline"
                onClick={handleDowngradeToFree}
                className="text-destructive border-destructive/30 hover:bg-destructive/5 h-10 px-5"
              >
                {t('manageSubscriptionPage.cancelSubscription', { defaultValue: 'Hủy Đăng ký' })}
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Card 3: Hành động thanh toán */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card rounded-2xl border border-border p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {t('manageSubscriptionPage.billingActions', { defaultValue: 'Hành động Thanh toán' })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('billingHistoryPage.viewInStripeDesc', {
                  defaultValue: 'Quản lý hóa đơn và chi tiết thanh toán qua cổng bảo mật',
                })}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
          >
            <span>{t('billingHistoryPage.viewInStripe', { defaultValue: 'Cổng thanh toán' })}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default SubscriptionPage;
