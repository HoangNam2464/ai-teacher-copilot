import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Crown,
  Check,
  X,
  ShieldCheck,
  Star,
  Sparkles,
  Zap,
  CreditCard,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/authStore';
import { userService } from '@/services/user';
import { PATHS } from '@/routes/paths';

/**
 * SubscriptionPage
 * Giao diện Quản lý Gói & Đăng ký (Subscription & Billing):
 * - Bố cục so sánh 2 cột: Gói Miễn Phí (Cơ bản) vs Gói Giáo Viên Pro (Phổ biến nhất)
 * - Màn hình Thanh toán / Order Summary chuyên nghiệp (Coupon, Quyền lợi, Xác nhận kích hoạt)
 * - Bộ chuyển đổi chu kỳ: Hàng tháng / Hàng năm (Tiết kiệm 20%)
 * - Ma trận tính năng chi tiết có icon Check / Cross
 * - Khối Trust Badges bảo chứng (Thanh toán an toàn, Hủy linh hoạt, Không cần thẻ)
 */
export function SubscriptionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [view, setView] = useState('plans'); // 'plans' | 'checkout'
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [loading, setLoading] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const isPro = user?.plan?.toLowerCase() === 'pro';

  const basePriceNumber = billingCycle === 'monthly' ? 149000 : 1428000;
  const finalPriceNumber = Math.round(basePriceNumber * (1 - discountPercent / 100));

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'GIAOVIEN2026' || code === 'K12VIP') {
      setDiscountPercent(100);
      setCouponSuccess(`Áp dụng thành công mã ${code}: Miễn phí 100% trải nghiệm gói Pro!`);
    } else if (code === 'K12PRO' || code === 'TEACHER50') {
      setDiscountPercent(50);
      setCouponSuccess(`Áp dụng thành công mã ${code}: Giảm 50% chi phí gói Pro!`);
    } else {
      setCouponError('Mã ưu đãi không hợp lệ hoặc đã hết hạn.');
    }
  };

  // Nâng cấp trực tiếp lên Pro theo logic chuẩn của authStore & backend
  const handleUpgradeToPro = async () => {
    setLoading(true);
    try {
      await userService.updatePlan('PRO');
      updateUser({ plan: 'pro' });
      setView('plans');
      toast.success(
        t('manageSubscriptionPage.upgradeSuccess', {
          defaultValue: 'Nâng cấp thành công! Tài khoản của bạn đã chuyển sang gói Pro.',
        })
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Nâng cấp thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Hủy đăng ký / Chuyển về gói Free
  const handleDowngradeToFree = async () => {
    setLoading(true);
    try {
      await userService.updatePlan('FREE');
      updateUser({ plan: 'free' });
      toast.info(
        t('manageSubscriptionPage.cancelSuccess', {
          defaultValue: 'Tài khoản của bạn đã chuyển về gói Miễn Phí.',
        })
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Hủy gói thất bại');
    } finally {
      setLoading(false);
    }
  };

  const freeFeatures = [
    { text: '3 Không gian làm việc (Lớp học)', included: true },
    { text: 'Tối đa 5 tài liệu tải lên (PDF, DOCX)', included: true },
    { text: '15 lượt tạo giáo án AI / tháng', included: true },
    { text: 'Tạo đề trắc nghiệm cơ bản', included: true },
    { text: 'Lưu trữ tài liệu cục bộ', included: true },
    { text: 'Không giới hạn dung lượng tài liệu SGK', included: false },
    { text: 'Phân loại Bloom 6 cấp độ chuyên sâu', included: false },
    { text: 'Trích dẫn nguồn & trang sách chính xác', included: false },
    { text: 'Xuất file Word (.docx) & PDF chuẩn Bộ GD&ĐT', included: false },
    { text: 'Ưu tiên xử lý AI tốc độ cao 24/7', included: false },
  ];

  const proFeatures = [
    { text: 'Không giới hạn Không gian làm việc', included: true },
    { text: 'Không giới hạn tài liệu tải lên (PDF, DOCX)', included: true },
    { text: 'Không giới hạn lượt tạo giáo án AI', included: true },
    { text: 'Tạo đề thi trắc nghiệm & tự luận đa dạng', included: true },
    { text: 'Phân loại Bloom 6 cấp độ chuẩn sư phạm', included: true },
    { text: 'Trích dẫn chính xác trang sách & nguồn ngữ liệu', included: true },
    { text: 'Xuất file Word (.docx) & PDF chuẩn mẫu GDPT', included: true },
    { text: 'Phân tích văn bản & hình ảnh đề bài (OCR)', included: true },
    { text: 'Lịch sử phiên bản & phục hồi nội dung', included: true },
    { text: 'Ưu tiên hạ tầng AI cao cấp & hỗ trợ 24/7', included: true },
  ];

  if (view === 'checkout') {
    return (
      <div className="max-w-2xl mx-auto py-4 sm:py-8 px-4">
        {/* Back to plans button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setView('plans');
              setCouponError('');
              setCouponSuccess('');
              setDiscountPercent(0);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {t('common.backToPlans', { defaultValue: 'Quay lại danh sách gói' })}
          </Button>
        </div>

        {/* Order Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        >
          {/* Green header banner with Crown */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Nâng cấp Gói Giáo Viên Pro</h2>
              <p className="text-xs text-white/80">
                {billingCycle === 'monthly'
                  ? 'Đăng ký hàng tháng (149.000đ/tháng)'
                  : 'Đăng ký hàng năm (1.428.000đ/năm — Tiết kiệm 20%)'}
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Order summary */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Tổng quan đơn hàng (Order Summary)
              </p>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center text-foreground">
                  <span>Gói Giáo Viên Pro ({billingCycle === 'monthly' ? 'Hàng tháng' : 'Hàng năm'})</span>
                  <span className="font-semibold">
                    {billingCycle === 'monthly' ? '149.000đ' : '1.428.000đ'}
                  </span>
                </div>

                {discountPercent > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium text-xs sm:text-sm">
                    <span>Mã ưu đãi giáo viên ({discountPercent}%)</span>
                    <span>-{new Intl.NumberFormat('vi-VN').format(basePriceNumber * (discountPercent / 100))}đ</span>
                  </div>
                )}

                <div className="pt-3 border-t border-border flex justify-between items-baseline">
                  <span className="font-bold text-base text-foreground">Tổng thanh toán</span>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {new Intl.NumberFormat('vi-VN').format(finalPriceNumber)}đ
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      /{billingCycle === 'monthly' ? 'tháng' : 'năm'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coupon Code section */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Mã ưu đãi giáo viên (Coupon Code)
              </label>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Nhập mã ưu đãi (vd: GIAOVIEN2026, K12PRO)"
                  className="flex-1 px-3.5 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button type="submit" variant="secondary" className="px-5 font-semibold text-sm">
                  Áp dụng
                </Button>
              </form>
              {couponSuccess && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {couponSuccess}
                </p>
              )}
              {couponError && (
                <p className="text-xs text-destructive font-medium mt-1.5">{couponError}</p>
              )}
            </div>

            {/* What you'll get */}
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Quyền lợi thầy/cô nhận được:
              </p>
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                {[
                  'Không giới hạn Không gian làm việc & SGK',
                  'Soạn giáo án AI không giới hạn chuẩn 5512',
                  'Tạo đề trắc nghiệm & tự luận chuẩn Bloom',
                  'Trích dẫn chính xác trang sách & ngữ liệu',
                  'Xuất file Word (.docx) & PDF chuẩn Bộ GD',
                  'Ưu tiên hạ tầng AI tốc độ cao 24/7',
                ].map((feat, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action button: Proceed to Payment */}
            <div>
              <Button
                onClick={handleUpgradeToPro}
                disabled={loading}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/25 text-base"
              >
                {loading ? <Spinner className="w-5 h-5 mr-2" /> : <CreditCard className="w-5 h-5 mr-2" />}
                Xác nhận thanh toán & Kích hoạt Pro
              </Button>
            </div>

            {/* Trust assurances footer */}
            <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground pt-2">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" /> Mã hóa SSL 256-bit
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Thanh toán an toàn
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-600" /> Hủy bất kỳ lúc nào
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-8 px-4">
      {/* Back button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(PATHS.SETTINGS.ROOT)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          {t('common.back', { defaultValue: 'Quay lại Cài đặt' })}
        </Button>
      </div>

      {/* Header section */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('subscription.badge', { defaultValue: 'Thay đổi gói giảng dạy' })}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3"
        >
          {t('subscription.title', { defaultValue: 'Nâng Tầm Năng Suất Giảng Dạy' })}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6"
        >
          {t('subscription.subtitle', {
            defaultValue:
              'Chọn gói phù hợp với nhu cầu soạn giáo án và ra đề thi chuẩn GDPT. Nâng cấp hoặc hủy gói bất kỳ lúc nào.',
          })}
        </motion.p>

        {/* Monthly / Yearly Switcher */}
        <div className="inline-flex items-center p-1 rounded-xl bg-muted/70 border border-border">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('subscription.monthly', { defaultValue: 'Hàng tháng' })}
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{t('subscription.yearly', { defaultValue: 'Hàng năm' })}</span>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded-full">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* 2 Comparison Cards */}
      <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-stretch mb-12">
        {/* Card 1: Free Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`relative bg-card rounded-2xl border p-6 sm:p-8 flex flex-col justify-between transition-all ${
            !isPro ? 'border-border shadow-xs' : 'border-border/60 opacity-90'
          }`}
        >
          {!isPro && (
            <div className="absolute -top-3 right-6 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
              {t('subscription.currentPlan', { defaultValue: 'Gói hiện tại' })}
            </div>
          )}

          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Gói Miễn Phí (Cơ bản)</h3>
                <p className="text-xs text-muted-foreground">Trải nghiệm các tính năng cốt lõi</p>
              </div>
            </div>

            <div className="my-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">0đ</span>
                <span className="text-muted-foreground text-sm font-medium">/ tháng</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Miễn phí vĩnh viễn, không cần thẻ</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/60 text-sm">
              {freeFeatures.map((feat, i) => (
                <div key={i} className="flex items-start gap-3">
                  {feat.included ? (
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                  )}
                  <span className={feat.included ? 'text-foreground/90 text-xs sm:text-sm' : 'text-muted-foreground/50 text-xs sm:text-sm'}>
                    {feat.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/60">
            {!isPro ? (
              <Button
                variant="outline"
                disabled
                className="w-full h-11 font-medium bg-muted/40 text-muted-foreground border-border cursor-default"
              >
                {t('subscription.alreadyActive', { defaultValue: 'Gói đang hoạt động' })}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleDowngradeToFree}
                disabled={loading}
                className="w-full h-11 font-medium text-destructive border-destructive/30 hover:bg-destructive/5"
              >
                {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
                {t('subscription.downgradeToFree', { defaultValue: 'Chuyển về gói Miễn Phí' })}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Card 2: Pro Plan (Recommended / Most Popular) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative bg-card rounded-2xl border-2 border-emerald-500 shadow-xl shadow-emerald-500/5 p-6 sm:p-8 flex flex-col justify-between"
        >
          <div className="absolute -top-3 right-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>{isPro ? 'Đang hoạt động' : 'Phổ biến nhất'}</span>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  Gói Giáo Viên Pro
                </h3>
                <p className="text-xs text-muted-foreground">Tối ưu cho giáo viên K-12 & tổ bộ môn</p>
              </div>
            </div>

            <div className="my-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight">
                  {billingCycle === 'monthly' ? '149.000đ' : '119.000đ'}
                </span>
                <span className="text-muted-foreground text-sm font-medium">/ tháng</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {billingCycle === 'yearly'
                  ? 'Thanh toán hàng năm (1.428.000đ/năm — Tiết kiệm 20%)'
                  : 'Thanh toán linh hoạt theo từng tháng'}
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/60 text-sm">
              {proFeatures.map((feat, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-foreground/90 font-medium text-xs sm:text-sm">
                    {feat.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/60">
            {!isPro ? (
              <Button
                onClick={() => setView('checkout')}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 text-sm"
              >
                <Zap className="w-4 h-4 mr-2" />
                {t('subscription.upgradeProBtn', { defaultValue: 'Nâng cấp lên Pro ngay' })}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  disabled
                  className="w-full h-11 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 cursor-default"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {t('subscription.activePro', { defaultValue: 'Bạn đang sử dụng gói Pro' })}
                </Button>
                <button
                  type="button"
                  onClick={handleDowngradeToFree}
                  className="w-full text-xs text-muted-foreground hover:text-destructive py-1 transition-colors"
                >
                  {t('manageSubscriptionPage.cancelSubscription', { defaultValue: 'Hủy đăng ký Pro' })}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* 3 Trust Badges */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border pt-8"
      >
        <div className="p-4 rounded-xl bg-card border border-border/60 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Thanh toán bảo mật</p>
            <p className="text-[11px] text-muted-foreground">Mã hóa an toàn 100% qua cổng thanh toán</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/60 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Hủy bất kỳ lúc nào</p>
            <p className="text-[11px] text-muted-foreground">Chủ động quản trị, không ràng buộc</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/60 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Trải nghiệm tự do</p>
            <p className="text-[11px] text-muted-foreground">Dùng thử trọn vẹn không cần thẻ tín dụng</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default SubscriptionPage;
