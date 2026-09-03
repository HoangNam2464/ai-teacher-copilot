import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';

export function CTASection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 p-12 lg:p-20 text-center text-white"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
          </div>

          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Sẵn sàng thay đổi phương pháp giảng dạy?
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Tiết kiệm 80% thời gian soạn bài
              <br />
              <span className="text-white/80">ngay hôm nay</span>
            </h2>

            <p className="text-white/80 text-lg max-w-2xl mx-auto leading-relaxed">
              Tham gia cùng hàng nghìn giáo viên Việt Nam đang sử dụng AI để tạo ra
              giáo án chất lượng cao, đề thi sáng tạo và tài liệu giảng dạy chuyên nghiệp.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  className="bg-white text-emerald-700 hover:bg-white/90 shadow-xl shadow-black/10 gap-2"
                  asChild
                >
                  <Link to={PATHS.WORKSPACES}>
                    Vào không gian làm việc
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="bg-white text-emerald-700 hover:bg-white/90 shadow-xl shadow-black/10"
                    asChild
                  >
                    <Link to={PATHS.REGISTER}>
                      <Zap className="w-5 h-5" />
                      Đăng ký miễn phí
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-white border-white/30 border hover:bg-white/10"
                    asChild
                  >
                    <Link to={PATHS.LOGIN}>
                      Đăng nhập
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>

            <p className="text-white/60 text-sm">
              Không cần thẻ tín dụng · Cài đặt trong 5 phút · Bảo mật dữ liệu tuyệt đối
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
