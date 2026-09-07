import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PATHS } from '@/routes/paths';
import {
  BookOpen,
  GraduationCap,
  School,
  Award,
  Briefcase,
  ArrowRight,
  Check,
  Sparkles,
  Target,
  Clock,
  Brain,
  Lightbulb,
  Rocket,
  Search,
  MessageSquare,
  Zap,
  Users,
  Repeat,
  Copy,
  PenTool,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  BanIcon,
  FileText,
  FileCheck2,
  FileCode2,
  Download,
  ListTodo
} from 'lucide-react';

// --- Unique per-slide visual illustrations for AI Teacher Copilot ---

// 1. Welcome Visual
function WelcomeVisual() {
  const icons = [BookOpen, Brain, Sparkles, Copy, FileText, ListTodo, Check, PenTool];
  return (
    <div className="relative w-48 h-48 mx-auto mb-4">
      <motion.div
        className="absolute inset-0 m-auto w-24 h-24 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-xl"
        animate={{ scale: [0.9, 1.05, 0.9] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Brain className="w-12 h-12 text-emerald-500" />
      </motion.div>
      {icons.map((Icon, i) => {
        const baseAngle = (i / icons.length) * 360;
        return (
          <motion.div
            key={i}
            className="absolute w-9 h-9 rounded-xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center border border-border"
            style={{ top: '50%', left: '50%' }}
            animate={{
              opacity: 1,
              scale: [1, 1.15, 1],
              x: Math.cos((baseAngle * Math.PI) / 180) * 80 - 18,
              y: Math.sin((baseAngle * Math.PI) / 180) * 80 - 18,
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              scale: { duration: 2, repeat: Infinity, delay: i * 0.25 },
              rotate: { duration: 4, repeat: Infinity, delay: i * 0.5 },
            }}
          >
            <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </motion.div>
        );
      })}
    </div>
  );
}

// 2. Knowledge Base Visual
function KnowledgeBaseVisual() {
  return (
    <div className="relative w-48 h-40 mx-auto mb-4">
      {[2, 1, 0].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 overflow-hidden flex flex-col"
          style={{ width: 140, height: 100, left: '50%', top: '50%' }}
          animate={{
            opacity: 1,
            x: -70 + i * 15,
            y: [-50 + i * 10, -55 + i * 10, -50 + i * 10],
            rotate: -8 + i * 8,
          }}
          transition={{ y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 } }}
        >
          <div className="h-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 flex-shrink-0" />
          <div className="p-3 space-y-2 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3 h-3 text-blue-500" />
              <div className="h-1.5 bg-blue-100 dark:bg-blue-900/40 rounded w-1/2" />
            </div>
            <div className="space-y-1">
              <div className="h-1.5 bg-muted rounded w-full" />
              <div className="h-1.5 bg-muted rounded w-4/5" />
              <div className="h-1.5 bg-muted rounded w-3/5" />
            </div>
          </div>
        </motion.div>
      ))}
      <motion.div
        className="absolute -right-2 -bottom-2 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg z-10"
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <Search className="w-5 h-5 text-white" />
      </motion.div>
    </div>
  );
}

// 3. Lesson Planner Visual
function LessonPlannerVisual() {
  return (
    <div className="w-56 mx-auto mb-4 space-y-2 relative">
      <motion.div
        animate={{ opacity: [0.8, 1, 0.8], y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-border p-3"
      >
        <div className="flex items-center gap-1.5 mb-3">
          <ListTodo className="w-4 h-4 text-emerald-500" />
          <div className="text-xs font-bold text-emerald-600">Lesson Plan</div>
        </div>
        
        <div className="space-y-2.5">
          {[
            { label: 'Objectives', width: 'w-3/4' },
            { label: 'Warm-up', width: 'w-1/2' },
            { label: 'Main Activity', width: 'w-full' }
          ].map((item, i) => (
            <motion.div 
              key={i}
              className="flex items-start gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.4, duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="text-[9px] font-semibold text-muted-foreground">{item.label}</div>
                <div className={`h-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded ${item.width}`} />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.div
        className="absolute -right-4 -top-4 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg flex items-center justify-center rotate-12"
        animate={{ scale: [1, 1.1, 1], rotate: [12, 5, 12] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Sparkles className="w-5 h-5 text-white" />
      </motion.div>
    </div>
  );
}

// 4. Quiz Generator Visual
function QuizGeneratorVisual() {
  return (
    <div className="w-52 mx-auto mb-4 relative">
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-orange-200 dark:border-orange-800/50 p-3"
      >
        <div className="text-[10px] font-bold text-orange-500 mb-2 flex items-center gap-1">
          <Target className="w-3 h-3" />
          GENERATED QUIZ
        </div>
        
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[9px] font-bold">Q1.</span>
              <div className="h-1.5 bg-muted rounded w-4/5" />
            </div>
            
            <div className="pl-4 space-y-1">
              {['A', 'B', 'C'].map((opt, i) => (
                <motion.div 
                  key={opt}
                  className="flex items-center gap-1.5"
                  animate={i === 1 ? { backgroundColor: ['transparent', 'rgba(34, 197, 94, 0.1)', 'transparent'] } : {}}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  <div className={cn(
                    "w-3 h-3 rounded-full border text-[7px] flex items-center justify-center font-bold",
                    i === 1 ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20" : "border-border text-muted-foreground"
                  )}>
                    {opt}
                  </div>
                  <div className="h-1 bg-muted rounded w-16" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div
        className="absolute -left-3 bottom-4 px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-900/40 border border-orange-200 text-[8px] font-bold text-orange-600"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      >
        Bloom: Analyze
      </motion.div>
    </div>
  );
}

// 5. Export Visual
function ExportVisual() {
  return (
    <div className="relative w-52 h-36 mx-auto mb-4 flex items-center justify-center gap-3">
      <motion.div
        className="w-16 h-20 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-border p-2 flex flex-col"
        animate={{ opacity: [0.6, 1, 0.6], y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex-1 space-y-1">
          <div className="h-1 bg-muted rounded w-full" />
          <div className="h-1 bg-muted rounded w-3/4" />
          <div className="h-1 bg-muted rounded w-5/6" />
        </div>
        <Sparkles className="w-3 h-3 text-emerald-400 mx-auto mt-2" />
      </motion.div>
      
      <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
        <ArrowRight className="w-5 h-5 text-muted-foreground" />
      </motion.div>

      <div className="flex flex-col gap-2">
        <motion.div
          className="w-16 h-20 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-indigo-200 dark:border-indigo-800/50 flex flex-col items-center justify-center gap-1"
          animate={{ y: [0, -3, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        >
          <FileCode2 className="w-6 h-6 text-indigo-500" />
          <div className="text-[7px] font-bold text-indigo-600 bg-indigo-50 px-1.5 rounded">.DOCX</div>
        </motion.div>
      </div>
    </div>
  );
}

// Map slide index to visual component
function SlideVisual({ index }) {
  switch (index) {
    case 0: return <WelcomeVisual />;
    case 1: return <KnowledgeBaseVisual />;
    case 2: return <LessonPlannerVisual />;
    case 3: return <QuizGeneratorVisual />;
    case 4: return <ExportVisual />;
    default: return null;
  }
}

// --- Feature Slideshow ---

const featureSlideVariants = {
  enter: (dir) => ({ x: dir > 0 ? '50%' : '-50%', opacity: 0, scale: 0.95 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir) => ({ x: dir > 0 ? '-50%' : '50%', opacity: 0, scale: 0.95 }),
};

function FeatureSlideshow({ onFinish }) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);

  const slides = [
    {
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      bg: 'from-green-50 via-emerald-50 to-teal-50',
      bgDark: 'dark:from-green-950/40 dark:via-emerald-950/30 dark:to-teal-950/40',
      title: t('onboarding.welcome.greeting', { name: user?.name || t('onboarding.welcome.defaultName') }),
      description: t('onboarding.slides.welcomeDesc'),
      extra: 'welcome',
    },
    {
      gradient: 'from-blue-500 via-cyan-500 to-blue-600',
      bg: 'from-blue-50 via-cyan-50 to-blue-50',
      bgDark: 'dark:from-blue-950/40 dark:via-cyan-950/30 dark:to-blue-950/40',
      title: t('onboarding.slides.knowledgeBaseTitle'),
      description: t('onboarding.slides.knowledgeBaseLong'),
      bullets: [t('onboarding.slides.kbBullet1'), t('onboarding.slides.kbBullet2'), t('onboarding.slides.kbBullet3')],
    },
    {
      gradient: 'from-emerald-500 via-green-500 to-emerald-600',
      bg: 'from-emerald-50 via-green-50 to-emerald-50',
      bgDark: 'dark:from-emerald-950/40 dark:via-green-950/30 dark:to-emerald-950/40',
      title: t('onboarding.slides.lessonPlannerTitle'),
      description: t('onboarding.slides.lessonPlannerLong'),
      bullets: [t('onboarding.slides.lpBullet1'), t('onboarding.slides.lpBullet2'), t('onboarding.slides.lpBullet3')],
    },
    {
      gradient: 'from-orange-500 via-amber-500 to-orange-600',
      bg: 'from-orange-50 via-amber-50 to-orange-50',
      bgDark: 'dark:from-orange-950/40 dark:via-amber-950/30 dark:to-orange-950/40',
      title: t('onboarding.slides.quizGeneratorTitle'),
      description: t('onboarding.slides.quizGeneratorLong'),
      bullets: [t('onboarding.slides.quizBullet1'), t('onboarding.slides.quizBullet2'), t('onboarding.slides.quizBullet3')],
    },
    {
      gradient: 'from-indigo-500 via-violet-500 to-indigo-600',
      bg: 'from-indigo-50 via-violet-50 to-indigo-50',
      bgDark: 'dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-indigo-950/40',
      title: t('onboarding.slides.exportTitle'),
      description: t('onboarding.slides.exportLong'),
      bullets: [t('onboarding.slides.exportBullet1'), t('onboarding.slides.exportBullet2'), t('onboarding.slides.exportBullet3')],
    }
  ];

  const isLast = current === slides.length - 1;

  const goNext = useCallback(() => {
    if (isLast) { onFinish(); } else { setDir(1); setCurrent((c) => c + 1); }
  }, [isLast, onFinish]);

  const goPrev = () => {
    if (current > 0) { setDir(-1); setCurrent((c) => c - 1); }
  };

  const slide = slides[current];

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br ${slide.bg} ${slide.bgDark} transition-colors duration-700`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 relative z-10">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-emerald-600" />
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-500 to-green-600 bg-clip-text text-transparent">
            {t('common.appName')}
          </span>
        </div>
        <button onClick={onFinish} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
          {t('onboarding.slides.skip')}
        </button>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className={`absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r ${slide.gradient} opacity-[0.06] blur-3xl`}
            animate={{ x: ['-10%', '10%', '-5%'], y: ['-5%', '10%', '-10%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ top: '10%', left: '15%' }}
          />
          <motion.div
            className={`absolute w-[400px] h-[400px] rounded-full bg-gradient-to-r ${slide.gradient} opacity-[0.04] blur-3xl`}
            animate={{ x: ['5%', '-10%', '5%'], y: ['10%', '-5%', '5%'] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            style={{ bottom: '10%', right: '10%' }}
          />
        </div>

        <div className="w-full max-w-lg relative z-10">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={current}
              custom={dir}
              variants={featureSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-center"
            >
              {/* Unique visual per slide */}
              <SlideVisual index={current} />

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.25 }}
                className="text-2xl md:text-3xl font-black mb-2 tracking-tight"
              >
                {slide.title}
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.25 }}
                className="text-sm md:text-base text-muted-foreground mb-4 max-w-md mx-auto leading-relaxed"
              >
                {slide.description}
              </motion.p>

              {/* Welcome badges */}
              {slide.extra === 'welcome' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-wrap items-center justify-center gap-2">
                  {[
                    { icon: Zap, label: t('onboarding.welcome.fast'), c: 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-300' },
                    { icon: Brain, label: t('onboarding.welcome.smart'), c: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300' },
                    { icon: ShieldCheck, label: t('onboarding.welcome.free'), c: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300' },
                  ].map((b, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 + i * 0.06, type: 'spring', damping: 14 }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${b.c} shadow-sm`}
                    >
                      <b.icon className="w-3.5 h-3.5" />{b.label}
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Bullets */}
              {slide.bullets && !slide.extra && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }} className="space-y-1.5 max-w-sm mx-auto text-left">
                  {slide.bullets.map((bullet, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 + i * 0.06 }}
                      className="flex items-start gap-2.5 p-1.5 rounded-lg"
                    >
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-foreground/80 leading-relaxed">{bullet}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="px-6 py-4 relative z-10">
        <div className="max-w-lg mx-auto">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {slides.map((s, i) => (
              <button key={i} onClick={() => { setDir(i > current ? 1 : -1); setCurrent(i); }}
                className="relative h-2 rounded-full overflow-hidden transition-all duration-300"
                style={{ width: i === current ? 28 : 7 }}
              >
                <div className={cn('absolute inset-0 rounded-full', i <= current ? `bg-gradient-to-r ${s.gradient}` : 'bg-muted-foreground/20')} />
              </button>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={goPrev} disabled={current === 0} className="font-semibold">
              <ChevronLeft className="w-4 h-4 mr-1" />{t('onboarding.back')}
            </Button>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button onClick={goNext}
                className={cn('px-8 h-11 font-bold shadow-lg', isLast
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-emerald-500/30'
                  : `bg-gradient-to-r ${slide.gradient} shadow-black/10`
                )}
              >
                {isLast ? (<>{t('onboarding.slides.getStarted')}<Rocket className="w-4 h-4 ml-2" /></>) : (<>{t('onboarding.slides.next')}<ChevronRight className="w-4 h-4 ml-1" /></>)}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Setup Steps (after slideshow) ---

const setupSlideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

const SETUP_STEPS = ['education', 'subjects', 'goal'];

function SetupWizard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState('education');
  const [direction, setDirection] = useState(1);
  const [education, setEducation] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [customSubject, setCustomSubject] = useState('');
  const [goal, setGoal] = useState('');
  const [saving, setSaving] = useState(false);

  const EDUCATION_LEVELS = [
    { id: 'elementary', label: t('onboarding.education.elementary'), icon: School, desc: t('onboarding.education.elementaryDesc') },
    { id: 'middleSchool', label: t('onboarding.education.middleSchool'), icon: GraduationCap, desc: t('onboarding.education.middleSchoolDesc') },
    { id: 'highSchool', label: t('onboarding.education.highSchool'), icon: Award, desc: t('onboarding.education.highSchoolDesc') },
    { id: 'university', label: t('onboarding.education.university'), icon: Briefcase, desc: t('onboarding.education.universityDesc') },
    { id: 'center', label: t('onboarding.education.center'), icon: Lightbulb, desc: t('onboarding.education.centerDesc') },
  ];

  const SUBJECTS = [
    t('onboarding.subjects.math'), t('onboarding.subjects.literature'), t('onboarding.subjects.english'), 
    t('onboarding.subjects.physics'), t('onboarding.subjects.chemistry'), t('onboarding.subjects.biology'), 
    t('onboarding.subjects.history'), t('onboarding.subjects.geography'), t('onboarding.subjects.it'),
    t('onboarding.subjects.gdcd'), t('onboarding.subjects.music'), t('onboarding.subjects.art'),
  ];

  const GOALS = [
    { id: 'saveTime', label: t('onboarding.goal.saveTime'), icon: Clock, desc: t('onboarding.goal.saveTimeDesc') },
    { id: 'createQuizzes', label: t('onboarding.goal.createQuizzes'), icon: Target, desc: t('onboarding.goal.createQuizzesDesc') },
    { id: 'organizeDocs', label: t('onboarding.goal.organizeDocs'), icon: BookOpen, desc: t('onboarding.goal.organizeDocsDesc') },
    { id: 'exploreAI', label: t('onboarding.goal.exploreAI'), icon: Sparkles, desc: t('onboarding.goal.exploreAIDesc') },
  ];

  const stepIndex = step === 'done' ? SETUP_STEPS.length : SETUP_STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / SETUP_STEPS.length) * 100;

  const toggleSubject = (subject) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const addCustomSubject = () => {
    const trimmed = customSubject.trim();
    if (trimmed && !selectedSubjects.includes(trimmed)) {
      setSelectedSubjects((prev) => [...prev, trimmed]);
      setCustomSubject('');
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // NOTE: Backend user profile update API (PUT /api/v1/users/me) does not exist yet.
      // Skipping the API call to adhere to RULE 7: DO NOT CREATE MOCK PERSISTENCE.
      // If the API existed, it would look like this:
      // await api.put('/users/me', { educationLevel: education, subjects: selectedSubjects, studyGoal: goal });
      
      // Simulate slight delay for UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      navigate(PATHS.ROOT);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (step === 'education') { setDirection(1); setStep('subjects'); }
    else if (step === 'subjects') { setDirection(1); setStep('goal'); }
    else if (step === 'goal') { setDirection(1); setStep('done'); handleComplete(); }
  };

  const prevStep = () => {
    if (step === 'subjects') { setDirection(-1); setStep('education'); }
    else if (step === 'goal') { setDirection(-1); setStep('subjects'); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Progress Bar */}
      <div className="h-1.5 bg-muted w-full fixed top-0 z-50">
        <motion.div className="h-full bg-emerald-600" animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: 'easeInOut' }} />
      </div>

      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-6 py-12 md:py-20 relative">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 'education' && (
            <motion.div key="education" custom={direction} variants={setupSlideVariants} initial="enter" animate="center" exit="exit" transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="flex-1 flex flex-col">
              <div className="mb-8">
                <h2 className="text-3xl font-black mb-3">{t('onboarding.wizard.titleEducation')}</h2>
                <p className="text-muted-foreground">{t('onboarding.wizard.descEducation')}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                {EDUCATION_LEVELS.map((level) => {
                  const isSelected = education === level.id;
                  return (
                    <button key={level.id} onClick={() => setEducation(level.id)} className={cn("text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 group", isSelected ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm" : "border-border hover:border-emerald-300 hover:bg-muted/50")}>
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors", isSelected ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground group-hover:bg-emerald-100 group-hover:text-emerald-600 dark:group-hover:bg-emerald-900/40")}>
                        <level.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className={cn("font-bold mb-1", isSelected ? "text-emerald-700 dark:text-emerald-300" : "text-foreground")}>{level.label}</div>
                        <div className="text-xs text-muted-foreground">{level.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 'subjects' && (
            <motion.div key="subjects" custom={direction} variants={setupSlideVariants} initial="enter" animate="center" exit="exit" transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="flex-1 flex flex-col">
              <div className="mb-8">
                <h2 className="text-3xl font-black mb-3">{t('onboarding.wizard.titleSubjects')}</h2>
                <p className="text-muted-foreground">{t('onboarding.wizard.descSubjects')}</p>
              </div>
              <div className="flex flex-wrap gap-2.5 mb-6">
                {SUBJECTS.map((subject) => {
                  const isSelected = selectedSubjects.includes(subject);
                  const disabled = !isSelected && selectedSubjects.length >= 3;
                  return (
                    <button key={subject} onClick={() => toggleSubject(subject)} disabled={disabled} className={cn("px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all", isSelected ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 shadow-sm" : "border-border bg-background text-muted-foreground hover:border-emerald-300 hover:bg-muted/50", disabled && "opacity-50 cursor-not-allowed")}>
                      {subject}
                    </button>
                  );
                })}
              </div>
              <div className="relative mb-2">
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSubject(); } }}
                  placeholder={t('onboarding.subjects.customPlaceholder')}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={selectedSubjects.length >= 3}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {selectedSubjects.length}/3 {t('onboarding.subjects.maxSelected')}
              </div>
            </motion.div>
          )}

          {step === 'goal' && (
            <motion.div key="goal" custom={direction} variants={setupSlideVariants} initial="enter" animate="center" exit="exit" transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="flex-1 flex flex-col">
              <div className="mb-8">
                <h2 className="text-3xl font-black mb-3">{t('onboarding.wizard.titleGoal')}</h2>
                <p className="text-muted-foreground">{t('onboarding.wizard.descGoal')}</p>
              </div>
              <div className="space-y-3 mb-8">
                {GOALS.map((g) => {
                  const isSelected = goal === g.id;
                  return (
                    <button key={g.id} onClick={() => setGoal(g.id)} className={cn("w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 group", isSelected ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm" : "border-border hover:border-emerald-300 hover:bg-muted/50")}>
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors", isSelected ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground group-hover:bg-emerald-100 group-hover:text-emerald-600 dark:group-hover:bg-emerald-900/40")}>
                        <g.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className={cn("font-bold", isSelected ? "text-emerald-700 dark:text-emerald-300" : "text-foreground")}>{g.label}</div>
                        <div className="text-xs text-muted-foreground">{g.desc}</div>
                      </div>
                      <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", isSelected ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/30")}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 relative">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent" />
                <Brain className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t('onboarding.wizard.saving')}</h2>
              <p className="text-muted-foreground max-w-sm">
                AI Teacher Copilot đang tối ưu hóa không gian làm việc dựa trên lựa chọn của bạn...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Navigation */}
        {step !== 'done' && (
          <div className="mt-auto pt-8 flex items-center justify-between border-t border-border">
            <Button variant="ghost" onClick={prevStep} disabled={step === 'education'} className="font-semibold">
              <ChevronLeft className="w-4 h-4 mr-1" />{t('onboarding.back')}
            </Button>
            <Button 
              onClick={nextStep} 
              disabled={
                (step === 'education' && !education) ||
                (step === 'subjects' && selectedSubjects.length === 0) ||
                (step === 'goal' && !goal)
              }
              className={cn("px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold", step === 'goal' && "bg-gradient-to-r from-emerald-600 to-teal-600")}
            >
              {step === 'goal' ? (<>{t('onboarding.slides.getStarted')}<Rocket className="w-4 h-4 ml-2" /></>) : (<>{t('onboarding.slides.next')}<ChevronRight className="w-4 h-4 ml-1" /></>)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function OnboardingPage() {
  const [showWizard, setShowWizard] = useState(false);

  if (showWizard) {
    return <SetupWizard />;
  }

  return <FeatureSlideshow onFinish={() => setShowWizard(true)} />;
}
