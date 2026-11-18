import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Calculator,
  BookOpen,
  Atom,
  FlaskConical,
  Microscope,
  Globe,
  Code,
  PenTool,
  Music,
  Dumbbell,
  Scale,
  Cpu,
  Palette,
  Languages,
} from 'lucide-react';

const subjects = [
  { nameKey: 'math', icon: Calculator, gradient: 'from-blue-500 to-indigo-500' },
  { nameKey: 'literature', icon: BookOpen, gradient: 'from-rose-500 to-pink-500' },
  { nameKey: 'physics', icon: Atom, gradient: 'from-violet-500 to-purple-500' },
  { nameKey: 'chemistry', icon: FlaskConical, gradient: 'from-emerald-500 to-teal-500' },
  { nameKey: 'biology', icon: Microscope, gradient: 'from-green-500 to-lime-500' },
  { nameKey: 'history', icon: Globe, gradient: 'from-amber-500 to-yellow-500' },
  { nameKey: 'geography', icon: Scale, gradient: 'from-cyan-500 to-blue-500' },
  { nameKey: 'english', icon: Languages, gradient: 'from-indigo-500 to-blue-600' },
  { nameKey: 'informatics', icon: Code, gradient: 'from-orange-500 to-red-500' },
  { nameKey: 'technology', icon: Cpu, gradient: 'from-slate-500 to-gray-600' },
  { nameKey: 'civicEducation', icon: PenTool, gradient: 'from-pink-500 to-fuchsia-500' },
  { nameKey: 'arts', icon: Palette, gradient: 'from-fuchsia-500 to-purple-500' },
  { nameKey: 'music', icon: Music, gradient: 'from-teal-500 to-cyan-500' },
  { nameKey: 'physicalEducation', icon: Dumbbell, gradient: 'from-red-500 to-rose-500' },
];

function SubjectPill({ nameKey, icon: Icon, gradient }) {
  const { t } = useTranslation();
  return (
    <div className="group relative flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/80 dark:bg-card/40 border border-border/40 whitespace-nowrap select-none backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-300 hover:shadow-md hover:shadow-emerald-500/5">
      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors duration-300">
        {t(`subjects.${nameKey}`, { defaultValue: nameKey })}
      </span>
    </div>
  );
}

function MarqueeRow({ items, direction = 'left', duration = 30 }) {
  const repeated = [...items, ...items, ...items];

  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
      <motion.div
        className="flex gap-4"
        animate={{
          x: direction === 'left' ? ['0%', '-33.33%'] : ['-33.33%', '0%'],
        }}
        transition={{
          x: {
            duration,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
      >
        {repeated.map((item, i) => (
          <SubjectPill key={`${item.nameKey}-${i}`} {...item} />
        ))}
      </motion.div>
    </div>
  );
}

export function TrustedBySection() {
  const { t } = useTranslation();

  return (
    <section className="py-16 lg:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-emerald-400/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1.15, 1, 1.15], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 bg-green-400/20 rounded-full blur-[100px]"
        />
      </div>

      <div className="container mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 mb-10">
        <motion.div
          className="text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-5"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {t('trustedBy.title')}
            </span>
          </motion.div>

          <h2 className="text-3xl md:text-4xl font-black text-foreground leading-tight">
            {t('trustedBy.heading')}{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 bg-clip-text text-transparent">
              {t('trustedBy.headingHighlight')}
            </span>
          </h2>
        </motion.div>
      </div>

      {/* Marquee Rows */}
      <div className="space-y-4">
        <MarqueeRow items={subjects.slice(0, 7)} direction="left" duration={30} />
        <MarqueeRow items={subjects.slice(7, 14)} direction="right" duration={34} />
      </div>
    </section>
  );
}
