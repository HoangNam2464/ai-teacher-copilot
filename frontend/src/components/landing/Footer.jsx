import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  ArrowRight,
  ArrowUp,
  Sparkles,
  Heart,
  Send,
  CheckCircle,
  GitBranch,
  BrainCircuit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PATHS } from '@/routes/paths';

const footerLinks = {
  product: [
    { name: 'Tính năng', href: '/#features' },
    { name: 'Cách hoạt động', href: '/#how-it-works' },
    { name: 'FAQ', href: '/#faq' },
  ],
  features: [
    { name: 'Workspace', href: PATHS.WORKSPACES },
    { name: 'Soạn Giáo Án', href: PATHS.LESSON_PLANNER },
    { name: 'Tạo Đề Trắc Nghiệm', href: PATHS.QUIZ_GENERATOR },
    { name: 'Quản lý Tài Liệu', href: PATHS.DOCUMENTS },
  ],
  legal: [
    { name: 'Điều khoản sử dụng', href: '#' },
    { name: 'Chính sách bảo mật', href: '#' },
  ],
};

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <footer className="relative overflow-hidden">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-br from-emerald-500/5 via-green-500/5 to-teal-500/5 border-t border-border/50">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 lg:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                Cập nhật tính năng mới
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                Nhận thông tin cập nhật sớm nhất
              </h3>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Đăng ký để nhận thông báo về tính năng mới, tips giảng dạy với AI và tài nguyên dành riêng cho giáo viên.
              </p>

              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@truong.edu.vn"
                    className="w-full h-11 px-4 pr-12 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    required
                  />
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>
                <Button
                  type="submit"
                  className="h-11 px-6"
                  disabled={isSubscribed}
                >
                  {isSubscribed ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Đã đăng ký!
                    </>
                  ) : (
                    <>
                      Đăng ký
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-3">
                Chúng tôi tôn trọng quyền riêng tư của bạn. Hủy đăng ký bất cứ lúc nào.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-muted/30 border-t border-border/50">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2">
              <Link to="/" className="inline-flex items-center gap-2.5 mb-5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-transform group-hover:scale-110">
                  <BrainCircuit className="w-6 h-6 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
                  AI Teacher Copilot
                </span>
              </Link>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm leading-relaxed">
                Trợ lý AI đắc lực dành riêng cho giáo viên K-12. Soạn giáo án, tạo đề thi và quản lý tài liệu thông minh với AI.
              </p>

              <div className="flex items-center gap-2">
                <a
                  href="mailto:contact@ai-teacher-copilot.edu.vn"
                  className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-emerald-500 hover:border-transparent hover:shadow-md transition-all"
                  aria-label="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-transparent hover:shadow-md transition-all"
                  aria-label="GitHub"
                >
                  <GitBranch className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-foreground">Sản phẩm</h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.name}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-foreground">Tính năng</h4>
              <ul className="space-y-3">
                {footerLinks.features.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.name}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-foreground">Pháp lý</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.name}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} AI Teacher Copilot. Bảo lưu mọi quyền.
              </p>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>Tạo ra với</span>
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                <span>dành cho giáo viên Việt Nam</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center hover:bg-emerald-600 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
}
