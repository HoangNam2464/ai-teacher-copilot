import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronDown,
  BookOpen,
  FileText,
  Brain,
  Lightbulb,
  ArrowRight,
  Zap,
  BrainCircuit,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const features = [
  {
    nameKey: 'header.features.workspace',
    descKey: 'header.features.workspaceDesc',
    icon: BookOpen,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    href: PATHS.WORKSPACES,
  },
  {
    nameKey: 'header.features.lessonPlanner',
    descKey: 'header.features.lessonPlannerDesc',
    icon: Brain,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    href: PATHS.LESSON_PLANNER,
  },
  {
    nameKey: 'header.features.quizGenerator',
    descKey: 'header.features.quizGeneratorDesc',
    icon: FileText,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    href: PATHS.QUIZ_GENERATOR,
  },
  {
    nameKey: 'nav.documents',
    descKey: 'documents.subtitle',
    icon: Lightbulb,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    href: PATHS.DOCUMENTS,
  },
];

const navLinks = [
  { nameKey: 'header.nav.features', href: '/#features', hasDropdown: true },
  { nameKey: 'header.nav.howItWorks', href: '/#how-it-works' },
  { nameKey: 'header.nav.faq', href: '/#faq' },
];

export function Header() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFeatureDropdownOpen, setIsFeatureDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    queueMicrotask(() => setIsMobileMenuOpen(false));
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm'
          : 'bg-background/80 backdrop-blur-sm border-b border-border/30 shadow-sm'
      )}
    >
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-transform group-hover:scale-110">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent hidden sm:block">
              AI Teacher Copilot
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <div key={link.name} className="relative">
                {link.hasDropdown ? (
                  <div
                    onMouseEnter={() => setIsFeatureDropdownOpen(true)}
                    onMouseLeave={() => setIsFeatureDropdownOpen(false)}
                  >
                    <button
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                        'hover:bg-muted text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {t(link.nameKey)}
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 transition-transform duration-200',
                          isFeatureDropdownOpen && 'rotate-180'
                        )}
                      />
                    </button>

                    <AnimatePresence>
                      {isFeatureDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-[560px]"
                        >
                          <div className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl shadow-black/5 p-5">
                            <div className="grid grid-cols-2 gap-2">
                              {features.map((feature) => (
                                <Link
                                  key={feature.nameKey}
                                  to={feature.href}
                                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/80 transition-colors group/item"
                                >
                                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', feature.bg)}>
                                    <feature.icon className={cn('w-5 h-5', feature.color)} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm group-hover/item:text-emerald-600 transition-colors">
                                      {t(feature.nameKey)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {t(feature.descKey)}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <Link
                                to={PATHS.WORKSPACES}
                                className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                              >
                                {t('common.viewAll')}
                                <ArrowRight className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <a
                    href={link.href}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-all hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    {t(link.nameKey)}
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <Link
                to={PATHS.WORKSPACES}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted border border-border/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center overflow-hidden">
                  <span className="text-sm font-semibold text-emerald-600">
                    {user?.initials || 'T'}
                  </span>
                </div>
                <span className="text-sm font-medium pr-1">{t('header.workspaceBtn', 'Workspace')}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to={PATHS.LOGIN}>{t('auth.login')}</Link>
                </Button>
                <Button asChild>
                  <Link to={PATHS.REGISTER}>
                    <Zap className="w-4 h-4 mr-1.5" />
                    {t('common.startFree')}
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-16 right-0 bottom-0 w-full sm:w-80 bg-background border-l border-border lg:hidden overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                {/* Navigation Links */}
                <div className="space-y-1">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <a
                        href={link.href}
                        className="flex items-center justify-between px-4 py-3 text-base font-medium rounded-lg transition-colors hover:bg-muted text-foreground"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t(link.nameKey)}
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </a>
                    </motion.div>
                  ))}
                </div>

                {/* Features Grid */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-3">
                    {t('features.badge')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {features.map((feature, index) => (
                      <motion.div
                        key={feature.nameKey}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.03 }}
                      >
                        <Link
                          to={feature.href}
                          className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors text-center"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', feature.bg)}>
                            <feature.icon className={cn('w-5 h-5', feature.color)} />
                          </div>
                          <span className="text-xs font-medium">{t(feature.nameKey)}</span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Auth Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pt-4 border-t border-border space-y-3"
                >
                  <div className="flex justify-end mb-4">
                    <LanguageSwitcher />
                  </div>
                  {isAuthenticated ? (
                    <Link
                      to={PATHS.WORKSPACES}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/60 hover:bg-muted border border-border/50 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <span className="text-base font-semibold text-emerald-600">
                          {user?.initials || 'T'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user?.displayName || t('dashboard.user')}</p>
                        <p className="text-xs text-muted-foreground">{t('header.enterWorkspace')}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ) : (
                    <>
                      <Button variant="outline" className="w-full h-12" asChild>
                        <Link to={PATHS.LOGIN} onClick={() => setIsMobileMenuOpen(false)}>{t('auth.login')}</Link>
                      </Button>
                      <Button className="w-full h-12" asChild>
                        <Link to={PATHS.REGISTER} onClick={() => setIsMobileMenuOpen(false)}>
                          <Zap className="w-4 h-4 mr-2" />
                          {t('common.startFree')}
                        </Link>
                      </Button>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
