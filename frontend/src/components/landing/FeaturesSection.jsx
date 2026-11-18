import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  Brain,
  FileText,
  Download,
  Quote,
  Tag,
  Shield,
  Sparkles,
  ArrowRight,
  Check,
  Loader2,
  BookOpen,
  Target,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Animated Demos ──────────────────────────────────────────────────

function UploadKnowledgeDemo() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const run = async () => {
      setStep(0); setItems([]);
      await new Promise(r => setTimeout(r, 500)); setStep(1);
      await new Promise(r => setTimeout(r, 800)); setStep(2);
      for (let i = 0; i < 4; i++) { await new Promise(r => setTimeout(r, 350)); setItems(prev => [...prev, i]); }
      await new Promise(r => setTimeout(r, 600)); setStep(3);
      await new Promise(r => setTimeout(r, 2000));
    };
    run();
    const interval = setInterval(run, 7000);
    return () => clearInterval(interval);
  }, []);

  const extractedItems = [
    t('howItWorks.demo.keyConcepts'),
    t('howItWorks.demo.definitions'),
    t('howItWorks.demo.formulas'),
    t('howItWorks.demo.objectives'),
  ];

  return (
    <div className="p-3 h-full flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="upload" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="text-center">
            <motion.div className="w-12 h-12 rounded-lg border-2 border-dashed border-blue-500/50 flex items-center justify-center mx-auto mb-2" animate={{ borderColor: ['rgba(59,130,246,0.3)', 'rgba(59,130,246,0.8)', 'rgba(59,130,246,0.3)'] }} transition={{ duration: 2, repeat: Infinity }}>
              <Upload className="w-5 h-5 text-blue-500" />
            </motion.div>
            <p className="text-[10px] text-muted-foreground">{t('features.demo.uploadPdfDocx')}</p>
          </motion.div>
        )}
        {step === 1 && (
          <motion.div key="uploading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center">
            <motion.div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-2" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
              <FileText className="w-5 h-5 text-white" />
            </motion.div>
            <p className="text-[10px] font-medium">{t('features.demo.analyzing')}</p>
            <div className="w-20 h-0.5 bg-muted rounded-full mt-1.5 mx-auto overflow-hidden">
              <motion.div className="h-full bg-blue-500 rounded-full" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.8 }} />
            </div>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="extracting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
            <div className="flex items-center gap-1.5 mb-2">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Brain className="w-3.5 h-3.5 text-blue-500" /></motion.div>
              <span className="text-[10px] font-medium">{t('features.demo.extracting')}</span>
            </div>
            <div className="space-y-1">
              {extractedItems.map((item, i) => (
                <motion.div key={item} initial={{ opacity: 0, x: -10 }} animate={{ opacity: items.includes(i) ? 1 : 0.3, x: items.includes(i) ? 0 : -10 }} className="flex items-center gap-1.5 p-1 bg-muted/30 rounded">
                  {items.includes(i) ? <Check className="w-3 h-3 text-blue-500" /> : <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                  <span className="text-[10px]">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
            <motion.div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
              <Check className="w-6 h-6 text-white" />
            </motion.div>
            <p className="font-medium text-xs">{t('features.demo.vectorIndexReady')}</p>
            <p className="text-[10px] text-muted-foreground">{t('features.demo.extractedConcepts')}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LessonPlanDemo() {
  const { t } = useTranslation();
  const [generatedItems, setGeneratedItems] = useState([]);
  const planItems = [
    t('features.demo.planItems.objectives'),
    t('features.demo.planItems.warmup'),
    t('features.demo.planItems.mainContent'),
    t('features.demo.planItems.assessment'),
  ];

  useEffect(() => {
    const run = async () => {
      setGeneratedItems([]);
      for (let i = 0; i < planItems.length; i++) {
        await new Promise(r => setTimeout(r, 800));
        setGeneratedItems(prev => [...prev, i]);
      }
      await new Promise(r => setTimeout(r, 3000));
    };
    run();
    const interval = setInterval(run, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center gap-1.5 mb-2.5">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <span className="text-[10px] font-semibold">{t('features.demo.lessonPlanner')}</span>
      </div>
      <div className="space-y-1.5 flex-1">
        {planItems.map((item, i) => {
          const isGenerated = generatedItems.includes(i);
          return (
            <motion.div
              key={item}
              animate={{ opacity: isGenerated ? 1 : 0.3, x: isGenerated ? 0 : -8 }}
              transition={{ duration: 0.4 }}
              className={cn(
                'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px]',
                isGenerated ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-muted/30'
              )}
            >
              {isGenerated ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Check className="w-3 h-3 text-emerald-500" />
                </motion.div>
              ) : (
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              )}
              <span className={isGenerated ? 'font-medium' : 'text-muted-foreground'}>{item}</span>
              {isGenerated && (
                <span className="ml-auto text-[8px] text-emerald-500 flex items-center gap-0.5">
                  <Quote className="w-2 h-2" /> {t('features.demo.citations')}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function QuizDemo() {
  const { t } = useTranslation();
  const [activeLevel, setActiveLevel] = useState(0);
  const bloomLevels = [
    { name: t('bloom.remember'), color: 'bg-blue-500', pct: 20 },
    { name: t('bloom.understand'), color: 'bg-emerald-500', pct: 25 },
    { name: t('bloom.apply'), color: 'bg-amber-500', pct: 20 },
    { name: t('bloom.analyze'), color: 'bg-orange-500', pct: 15 },
    { name: t('bloom.evaluate'), color: 'bg-rose-500', pct: 10 },
    { name: t('bloom.create'), color: 'bg-purple-500', pct: 10 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLevel(prev => (prev + 1) % bloomLevels.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center gap-1.5 mb-3">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
          <Target className="w-3 h-3 text-white" />
        </div>
        <span className="text-[10px] font-semibold">{t('features.demo.bloomQuiz')}</span>
      </div>
      <div className="space-y-1 flex-1">
        {bloomLevels.map((level, i) => (
          <div key={level.name} className="flex items-center gap-2">
            <span className="text-[8px] text-muted-foreground w-14 truncate">{level.name}</span>
            <div className="flex-1 h-3 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', level.color)}
                initial={{ width: 0 }}
                animate={{ width: `${level.pct}%`, opacity: i === activeLevel ? 1 : 0.6 }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              />
            </div>
            <motion.span
              className="text-[8px] w-6 text-right font-medium"
              animate={{ scale: i === activeLevel ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.5 }}
            >
              {level.pct}%
            </motion.span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
        <Tag className="w-3 h-3 text-amber-500" />
        <span>{t('features.demo.autoTagged')}</span>
      </div>
    </div>
  );
}

function GenericFeatureDemo({ icon: Icon, gradient, title, items }) {
  const [activeItem, setActiveItem] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setActiveItem(prev => (prev + 1) % items.length), 1500);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <div className="p-4 h-full flex flex-col items-center justify-center gap-3">
      <motion.div
        className={cn('w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center', gradient)}
        animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon className="w-7 h-7 text-white" />
      </motion.div>
      <p className="text-xs font-semibold text-center">{title}</p>
      <div className="w-full space-y-1">
        {items.map((item, i) => (
          <motion.div
            key={item}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] transition-all',
              i === activeItem ? 'bg-primary/10 text-foreground' : 'text-muted-foreground/60'
            )}
            animate={i === activeItem ? { x: [0, 3, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className={cn('w-1 h-1 rounded-full', i === activeItem ? 'bg-primary' : 'bg-muted-foreground/30')}
              animate={i === activeItem ? { scale: [1, 1.5, 1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            {item}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Feature Tab Button ──────────────────────────────────────────────

function FeatureTabItem({ tab, isActive, onClick, side }) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative w-full text-left p-4 rounded-xl transition-all duration-300 group',
        isActive
          ? 'bg-card shadow-md border border-border/60'
          : 'hover:bg-card/50'
      )}
      whileHover={!isActive ? { x: 4 } : undefined}
    >
      {isActive && (
        <motion.div
          layoutId={`activeIndicator-${side}`}
          className={cn(
            'absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b',
            tab.gradient,
          )}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
        />
      )}
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300',
          isActive ? `bg-gradient-to-br ${tab.gradient}` : 'bg-muted/60'
        )}>
          <tab.icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-muted-foreground')} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={cn(
            'font-semibold text-sm transition-colors leading-tight',
            isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
          )}>
            {tab.title}
          </h3>
          {isActive && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-xs mt-1 text-muted-foreground line-clamp-2 leading-relaxed"
            >
              {tab.description}
            </motion.p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ─── Main Section ────────────────────────────────────────────────────

export function FeaturesSection() {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  const [activeTab, setActiveTab] = useState(0);
  const autoTimerRef = useRef(null);

  const startAutoPlay = () => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      setActiveTab(prev => (prev + 1) % 6);
    }, 8000);
  };

  useEffect(() => {
    startAutoPlay();
    return () => { if (autoTimerRef.current) clearInterval(autoTimerRef.current); };
  }, []);

  const handleTabClick = (index) => {
    setActiveTab(index);
    startAutoPlay();
  };

  const allFeatures = useMemo(() => [
    // Left side (0-2)
    {
      key: 'upload',
      title: t('features.items.f1Title'),
      description: t('features.items.f1Desc'),
      icon: Upload,
      gradient: 'from-blue-500 to-cyan-500',
      demo: <UploadKnowledgeDemo />,
    },
    {
      key: 'lesson',
      title: t('features.items.f2Title'),
      description: t('features.items.f2Desc'),
      icon: Brain,
      gradient: 'from-emerald-500 to-green-500',
      demo: <LessonPlanDemo />,
    },
    {
      key: 'quiz',
      title: t('features.items.f3Title'),
      description: t('features.items.f3Desc'),
      icon: FileText,
      gradient: 'from-orange-500 to-amber-500',
      demo: <QuizDemo />,
    },
    // Right side (3-5)
    {
      key: 'bloom',
      title: t('features.items.f4Title'),
      description: t('features.items.f4Desc'),
      icon: Tag,
      gradient: 'from-purple-500 to-violet-500',
      demo: <GenericFeatureDemo icon={Tag} gradient="from-purple-500 to-violet-500" title={t('features.items.f4Title')} items={[t('bloom.remember'), t('bloom.understand'), t('bloom.apply'), t('bloom.analyze'), t('bloom.evaluate'), t('bloom.create')]} />,
    },
    {
      key: 'citation',
      title: t('features.items.f5Title'),
      description: t('features.items.f5Desc'),
      icon: Quote,
      gradient: 'from-teal-500 to-cyan-500',
      demo: <GenericFeatureDemo icon={BookOpen} gradient="from-teal-500 to-cyan-500" title={t('features.items.f5Title')} items={[t('features.demo.sourceChunkId'), t('features.demo.pageNumber'), t('features.demo.documentName'), t('features.demo.excerptPreview')]} />,
    },
    {
      key: 'export',
      title: t('features.items.f6Title'),
      description: t('features.items.f6Desc'),
      icon: Download,
      gradient: 'from-rose-500 to-pink-500',
      demo: <GenericFeatureDemo icon={Download} gradient="from-rose-500 to-pink-500" title={t('features.items.f6Title')} items={[t('features.demo.inlineEditing'), t('features.demo.aiRegeneration'), t('features.demo.exportWord'), t('features.demo.exportPdf')]} />,
    },
  ], [t]);

  const leftFeatures = allFeatures.slice(0, 3);
  const rightFeatures = allFeatures.slice(3, 6);
  const activeFeature = allFeatures[activeTab];

  return (
    <section ref={sectionRef} id="features" className="py-20 lg:py-28 relative overflow-hidden bg-gradient-to-b from-emerald-50/30 via-emerald-50/50 to-emerald-50/30 dark:from-emerald-950/10 dark:via-emerald-950/20 dark:to-emerald-950/10">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.03] to-transparent dark:via-emerald-400/[0.03]" />
        <motion.div style={{ y: y1 }} className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-emerald-400/15 to-green-400/10 dark:from-emerald-600/15 dark:to-green-600/10 rounded-full blur-3xl" />
        <motion.div style={{ y: y2 }} className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-teal-400/15 to-emerald-400/10 dark:from-teal-600/15 dark:to-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.04)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="container mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <motion.div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-5" whileHover={{ scale: 1.05 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
                <Sparkles className="w-4 h-4" />
              </motion.div>
              {t('features.badge')}
            </motion.div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {t('features.title')}{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">
                  {t('features.titleHighlight')}
                </span>
                <motion.svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 300 12" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.5 }}>
                  <motion.path d="M2 8 Q 75 2, 150 8 Q 225 14, 298 8" stroke="url(#featureGrad)" strokeWidth="4" strokeLinecap="round" fill="none" />
                  <defs><linearGradient id="featureGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#10b981" /><stop offset="50%" stopColor="#22c55e" /><stop offset="100%" stopColor="#14b8a6" /></linearGradient></defs>
                </motion.svg>
              </span>
            </h2>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('features.description')}
            </p>
          </motion.div>
        </div>

        {/* 3 Left | Demo Center | 3 Right */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid lg:grid-cols-[1fr_480px_1fr] gap-4 mb-12"
        >
          {/* Left Tabs */}
          <div className="space-y-1.5 flex flex-col justify-center">
            {leftFeatures.map((tab, i) => (
              <FeatureTabItem key={tab.key} tab={tab} isActive={activeTab === i} onClick={() => handleTabClick(i)} side="left" />
            ))}
          </div>

          {/* Center Demo */}
          <div className="relative bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20 min-h-[300px]">
            {/* Gradient top bar */}
            <motion.div
              className={cn('absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r', activeFeature.gradient)}
              layoutId="demoTopBar"
              transition={{ duration: 0.3 }}
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                {activeFeature.demo}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Tabs */}
          <div className="space-y-1.5 flex flex-col justify-center">
            {rightFeatures.map((tab, i) => (
              <FeatureTabItem key={tab.key} tab={tab} isActive={activeTab === i + 3} onClick={() => handleTabClick(i + 3)} side="right" />
            ))}
          </div>
        </motion.div>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-center gap-3 text-sm text-muted-foreground"
        >
          <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            {t('features.securityNote')}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
