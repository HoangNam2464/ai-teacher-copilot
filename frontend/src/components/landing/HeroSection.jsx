import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  FileText,
  Brain,
  BookOpen,
  Upload,
  Loader2,
  Check,
  GraduationCap,
  Star,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { cn } from '@/lib/utils';

// Animated Demo Component
function AnimatedDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [analyzedItems, setAnalyzedItems] = useState([]);
  const [generatedOutputs, setGeneratedOutputs] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const analyzeItems = [
    { icon: FileText, label: 'Cấu trúc tài liệu' },
    { icon: Brain, label: 'Nội dung học thuật' },
    { icon: BookOpen, label: 'Bloom Taxonomy levels' },
    { icon: GraduationCap, label: 'Mục tiêu học tập' },
  ];

  const generateOutputs = [
    { icon: BookOpen, label: 'Giáo Án Cấu Trúc', color: 'text-amber-500', bg: 'from-amber-500/20 to-orange-500/20' },
    { icon: FileText, label: 'Đề Trắc Nghiệm', color: 'text-rose-500', bg: 'from-rose-500/20 to-pink-500/20' },
    { icon: Star, label: 'Câu Hỏi Tự Luận', color: 'text-blue-500', bg: 'from-blue-500/20 to-cyan-500/20' },
    { icon: GraduationCap, label: 'Rubric Chấm Điểm', color: 'text-violet-500', bg: 'from-violet-500/20 to-purple-500/20' },
  ];

  const stepColors = [
    { bg: 'from-blue-500 to-cyan-500', text: 'text-blue-500', dot: 'bg-blue-500' },
    { bg: 'from-violet-500 to-purple-500', text: 'text-violet-500', dot: 'bg-violet-500' },
    { bg: 'from-amber-500 to-orange-500', text: 'text-amber-500', dot: 'bg-amber-500' },
    { bg: 'from-green-500 to-emerald-500', text: 'text-green-500', dot: 'bg-green-500' },
  ];

  const stepLabels = ['Upload', 'Phân tích', 'Tạo nội dung', 'Hoàn thành'];
  const stepDots = ['bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-green-500'];

  useEffect(() => {
    let cancelled = false;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    const runLoop = async () => {
      while (!cancelled) {
        setShowConfetti(false);
        setAnalyzedItems([]);
        setGeneratedOutputs([]);
        setUploadProgress(0);

        // Step 0: Upload
        setCurrentStep(0);
        setHasStarted(true);
        for (let i = 0; i <= 100; i += 3) {
          if (cancelled) return;
          await wait(25);
          setUploadProgress(Math.min(i, 100));
        }
        setUploadProgress(100);
        if (cancelled) return;
        await wait(400);

        // Step 1: Analyze
        if (cancelled) return;
        setCurrentStep(1);
        for (let i = 0; i < 4; i++) {
          if (cancelled) return;
          await wait(400);
          setAnalyzedItems((prev) => [...prev, i]);
        }
        if (cancelled) return;
        await wait(300);

        // Step 2: Generate
        if (cancelled) return;
        setCurrentStep(2);
        setGeneratedOutputs([]);
        for (let i = 0; i < 4; i++) {
          if (cancelled) return;
          await wait(400);
          setGeneratedOutputs((prev) => [...prev, i]);
        }
        if (cancelled) return;
        await wait(500);

        // Step 3: Ready
        if (cancelled) return;
        setCurrentStep(3);
        setShowConfetti(true);
        if (cancelled) return;
        await wait(3500);
      }
    };

    runLoop();
    return () => {
      cancelled = true;
    };
  }, []);

  const confettiColors = ['#22c55e', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

  return (
    <div className="relative">
      {/* Glow */}
      <motion.div
        className={`absolute -inset-3 bg-gradient-to-r ${stepColors[currentStep].bg} rounded-2xl blur-2xl`}
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <motion.div
        className="relative bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Titlebar */}
        <div className="relative bg-muted/50 border-b border-border px-5 py-3 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-semibold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
                  AI Teacher Copilot
                </span>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${stepColors[currentStep].text}`}>
              <motion.div
                className={`w-1.5 h-1.5 rounded-full ${stepDots[currentStep]}`}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              {stepLabels[currentStep]}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 min-h-[320px] relative">
          {/* Confetti */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
              {[...Array(18)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: confettiColors[i % confettiColors.length],
                    left: `${Math.random() * 100}%`,
                  }}
                  initial={{ y: -10, opacity: 1, rotate: 0 }}
                  animate={{ y: 380, opacity: 0, rotate: Math.random() * 360, x: (Math.random() - 0.5) * 80 }}
                  transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.4, ease: 'easeOut' }}
                />
              ))}
            </div>
          )}

          {/* Step Indicators */}
          <div className="flex items-center gap-1 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center flex-1">
                <motion.div
                  className={`relative overflow-hidden w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                    hasStarted && i < currentStep
                      ? `${stepDots[i]} text-white shadow-md`
                      : hasStarted && i === currentStep
                      ? `${stepDots[i]} text-white shadow-lg`
                      : 'bg-muted text-muted-foreground'
                  }`}
                  animate={hasStarted && i === currentStep ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {hasStarted && i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                </motion.div>
                {i < 3 && (
                  <div className="flex-1 h-0.5 mx-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${stepDots[i]} rounded-full`}
                      animate={{ width: hasStarted && i < currentStep ? '100%' : '0%' }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {/* Step 0: Upload */}
            {currentStep === 0 && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-500/8 border border-blue-500/15">
                  <motion.div
                    className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/25"
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FileText className="w-5 h-5 text-white" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">Sách giáo khoa Toán 10.pdf</p>
                    <p className="text-xs text-muted-foreground">PDF • 12.4MB • 286 trang</p>
                  </div>
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <Upload className="w-4 h-4 text-blue-500" />
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                      Đang tải tài liệu lên...
                    </span>
                    <span className="font-semibold text-blue-500">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {['PDF', 'DOCX', 'TXT', 'PPT'].map((tag, i) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="px-2.5 py-1 rounded-md text-[10px] font-medium border border-blue-500/20 text-blue-500 bg-blue-500/5"
                    >
                      {tag}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1: Analyze */}
            {currentStep === 1 && (
              <motion.div
                key="analyze"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3 h-3 text-violet-500 animate-spin" />
                  AI đang phân tích nội dung tài liệu...
                </p>
                {analyzeItems.map((item, i) => (
                  <AnimatePresence key={i}>
                    {analyzedItems.includes(i) && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/15"
                      >
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-violet-500" />
                        </div>
                        <span className="text-sm font-medium flex-1">{item.label}</span>
                        <Check className="w-4 h-4 text-emerald-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                ))}
              </motion.div>
            )}

            {/* Step 2: Generate */}
            {currentStep === 2 && (
              <motion.div
                key="generate"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  AI đang tạo nội dung giảng dạy...
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {generateOutputs.map((output, i) => (
                    <AnimatePresence key={i}>
                      {generatedOutputs.includes(i) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`p-3 rounded-xl bg-gradient-to-br ${output.bg} border border-border/50`}
                        >
                          <output.icon className={`w-5 h-5 ${output.color} mb-2`} />
                          <p className="text-xs font-medium">{output.label}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Ready */}
            {currentStep === 3 && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center h-48 text-center space-y-4"
              >
                <motion.div
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-xl shadow-emerald-500/30"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Check className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <p className="font-bold text-lg text-emerald-600">Hoàn thành!</p>
                  <p className="text-sm text-muted-foreground mt-1">4 tài liệu giảng dạy đã sẵn sàng</p>
                </div>
                <div className="flex items-center gap-2">
                  {['Giáo Án', 'Đề Thi', 'Tự Luận', 'Rubric'].map((label) => (
                    <span
                      key={label}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// Statistics
const stats = [
  { value: '80%', label: 'Tiết kiệm thời gian soạn bài' },
  { value: '6 loại', label: 'Bloom Taxonomy được tích hợp' },
  { value: '100%', label: 'Trích dẫn nguồn chính xác' },
];

export function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative overflow-hidden pt-24 lg:pt-32 pb-16 lg:pb-24">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-background to-green-50/50 dark:from-emerald-950/20 dark:via-background dark:to-green-950/10" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text */}
          <div className="space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Trợ lý AI dành riêng cho Giáo Viên K-12
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
            >
              Soạn Giáo Án &{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
                Tạo Đề Thi
              </span>{' '}
              với AI
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-muted-foreground leading-relaxed"
            >
              Tải lên tài liệu giảng dạy, AI sẽ phân tích và tự động tạo ra giáo án cấu trúc chuẩn,
              đề trắc nghiệm theo Bloom Taxonomy, câu hỏi tự luận — tất cả đều có trích dẫn nguồn
              rõ ràng. Giải phóng <strong>80% thời gian soạn bài</strong>.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {isAuthenticated ? (
                <Button size="lg" asChild className="shadow-lg shadow-emerald-500/25">
                  <Link to={PATHS.WORKSPACES}>
                    Vào không gian làm việc
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild className="shadow-lg shadow-emerald-500/25">
                    <Link to={PATHS.REGISTER}>
                      <Zap className="w-5 h-5" />
                      Bắt đầu miễn phí
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to={PATHS.LOGIN}>
                      Đăng nhập
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-6 pt-4 border-t border-border"
            >
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Column - Demo */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <AnimatedDemo />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
