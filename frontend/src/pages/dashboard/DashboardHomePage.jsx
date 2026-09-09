import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { documentService } from '@/services/documents';
import { historyService } from '@/services/history';
import { PATHS } from '@/routes/paths';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  Plus,
  FolderOpen,
  BookOpen,
  Brain,
  FileText,
  ArrowRight,
  Sparkles,
  Trophy,
  Zap,
  FileQuestion,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';

function getGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return 'dashboard.greeting.morning';
  if (hour < 17) return 'dashboard.greeting.afternoon';
  return 'dashboard.greeting.evening';
}

function StatCard({ icon: Icon, value, label, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-card border border-border rounded-xl p-5 hover:border-green-500/30 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

function QuickActionCard({ icon: Icon, title, description, href, color }) {
  return (
    <Link
      to={href}
      className="bg-card border border-border rounded-xl p-5 hover:border-green-500/50 hover:shadow-md transition-all group block"
    >
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-semibold mb-1 group-hover:text-green-600 transition-colors">{title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-1">{description}</p>
    </Link>
  );
}

function RecentWorkspaceCard({ workspace, isActive, onSelect }) {
  const { t } = useTranslation();
  return (
    <div
      onClick={() => onSelect(workspace)}
      className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-green-500/50 hover:shadow-sm transition-all cursor-pointer group"
    >
      <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 transition-colors">
        <FolderOpen className="w-6 h-6 text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate group-hover:text-green-600 transition-colors">
            {workspace.name}
          </h4>
          {isActive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
              <CheckCircle2 className="w-3 h-3" />
              {t('common.selected', 'Đang hoạt động')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          {workspace.subject && (
            <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground font-medium">
              {workspace.subject}
            </span>
          )}
          {workspace.gradeLevel && (
            <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground font-medium">
              {workspace.gradeLevel}
            </span>
          )}
          {workspace.description && (
            <span className="truncate text-xs text-muted-foreground hidden sm:inline">
              • {workspace.description}
            </span>
          )}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-green-600 group-hover:translate-x-0.5 transition-all" />
    </div>
  );
}

export function DashboardHomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, displayName } = useAuth();
  const {
    workspaces,
    activeWorkspace,
    isLoading,
    isInitialized,
    fetchWorkspaces,
    setActiveWorkspace,
  } = useWorkspaceStore();

  const [stats, setStats] = useState({
    documentsCount: 0,
    lessonPlansCount: 0,
    quizzesCount: 0,
  });

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Load auxiliary stats for active workspace in background
  useEffect(() => {
    if (!activeWorkspace?.id) return;
    let isMounted = true;

    async function loadWorkspaceStats() {
      try {
        const [docsRes, histRes] = await Promise.allSettled([
          documentService.getDocuments(activeWorkspace.id),
          historyService.getHistory(activeWorkspace.id),
        ]);

        const docs = docsRes.status === 'fulfilled' && Array.isArray(docsRes.value) ? docsRes.value : [];
        const historyItems = histRes.status === 'fulfilled' && Array.isArray(histRes.value) ? histRes.value : [];

        const lessons = historyItems.filter((i) => i.generationType === 'LESSON_PLAN' || i.type === 'LESSON_PLAN').length;
        const quizzes = historyItems.filter((i) => i.generationType === 'QUIZ' || i.type === 'QUIZ').length;

        if (isMounted) {
          setStats({
            documentsCount: docs.length,
            lessonPlansCount: lessons,
            quizzesCount: quizzes,
          });
        }
      } catch (err) {
        console.warn('Could not load workspace stats:', err);
      }
    }

    loadWorkspaceStats();
    return () => {
      isMounted = false;
    };
  }, [activeWorkspace?.id]);

  const handleSelectWorkspace = (workspace) => {
    setActiveWorkspace(workspace);
    navigate(PATHS.DOCUMENTS);
  };

  const recentWorkspaces = workspaces.slice(0, 5);
  const greeting = t(getGreetingKey(), 'Chào buổi sáng');
  const teacherName = displayName?.split(' ').pop() || t('dashboard.user', 'Giáo viên');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome header with wave animation */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <span>{greeting}, {teacherName}</span>
              <motion.span
                className="inline-block origin-[70%_70%]"
                animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                transition={{ duration: 1.5, delay: 0.3, ease: 'easeInOut' }}
              >
                👋
              </motion.span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              {activeWorkspace ? (
                <span>
                  {t('workspace.activeContext', 'Không gian đang chọn: ')}
                  <strong className="text-foreground">{activeWorkspace.name}</strong>
                  {activeWorkspace.subject && ` (${activeWorkspace.subject})`}
                </span>
              ) : (
                <span>{t('dashboard.readyToContinue', 'Sẵn sàng bắt đầu chuẩn bị bài giảng hôm nay cùng AI')}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-green-600 hover:bg-green-700 text-white" asChild>
              <Link to={PATHS.LESSON_PLANNER}>
                <Plus className="w-4 h-4 mr-2" />
                {t('workspace.quickActions.newLesson', 'Soạn giáo án mới')}
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FolderOpen}
          value={workspaces.length}
          label={t('workspace.stats.total', 'Không gian làm việc')}
          color="bg-green-500/10 text-green-600"
          delay={0.05}
        />
        <StatCard
          icon={BookOpen}
          value={stats.documentsCount}
          label={t('nav.documents', 'Tài liệu học liệu')}
          color="bg-blue-500/10 text-blue-600"
          delay={0.1}
        />
        <StatCard
          icon={Brain}
          value={stats.lessonPlansCount}
          label={t('nav.lessonPlanner', 'Giáo án đã soạn')}
          color="bg-purple-500/10 text-purple-600"
          delay={0.15}
        />
        <StatCard
          icon={FileQuestion}
          value={stats.quizzesCount}
          label={t('nav.quizGenerator', 'Đề thi & Đánh giá')}
          color="bg-amber-500/10 text-amber-600"
          delay={0.2}
        />
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
        <h2 className="text-lg font-semibold mb-4">
          {t('workspace.quickActions.title', 'Thao tác nhanh')}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            icon={Brain}
            title={t('workspace.quickActions.newLesson', 'Soạn giáo án mới')}
            description={t('workspace.quickActions.newLessonDesc', 'Tạo giáo án có cấu trúc chuẩn')}
            href={PATHS.LESSON_PLANNER}
            color="bg-green-500/10 text-green-600"
          />
          <QuickActionCard
            icon={FileQuestion}
            title={t('workspace.quickActions.newQuiz', 'Tạo đề thi mới')}
            description={t('workspace.quickActions.newQuizDesc', 'Tạo đề kiểm tra và câu hỏi')}
            href={PATHS.QUIZ_GENERATOR}
            color="bg-purple-500/10 text-purple-600"
          />
          <QuickActionCard
            icon={UploadCloud}
            title={t('workspace.quickActions.uploadDoc', 'Tải tài liệu lên')}
            description={t('workspace.quickActions.uploadDocDesc', 'Bổ sung vào kho tri thức')}
            href={PATHS.DOCUMENTS}
            color="bg-blue-500/10 text-blue-600"
          />
          <QuickActionCard
            icon={FolderOpen}
            title={t('workspace.title', 'Quản lý không gian')}
            description={t('workspace.subtitle', 'Phân nhóm theo lớp và môn học')}
            href={PATHS.WORKSPACES}
            color="bg-amber-500/10 text-amber-600"
          />
        </div>
      </motion.div>

      {/* Recent Workspaces section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {t('workspace.recent', 'Không gian làm việc gần đây')}
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to={PATHS.WORKSPACES} className="text-sm font-medium hover:text-green-600 flex items-center">
              {t('common.viewAll', 'Xem tất cả')}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>

        {isLoading && !isInitialized ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="w-7 h-7 text-green-600" />
          </div>
        ) : recentWorkspaces.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t('workspace.empty', 'Chưa có không gian làm việc nào')}
            </h3>
            <p className="text-muted-foreground mb-5 text-sm max-w-md mx-auto">
              {t('workspace.emptyDesc', 'Tạo không gian làm việc đầu tiên để bắt đầu tải tài liệu và soạn giáo án.')}
            </p>
            <Button className="bg-green-600 hover:bg-green-700 text-white" asChild>
              <Link to={PATHS.WORKSPACES}>
                <Plus className="w-4 h-4 mr-2" />
                {t('workspace.createFirst', 'Tạo không gian ngay')}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentWorkspaces.map((workspace) => (
              <RecentWorkspaceCard
                key={workspace.id}
                workspace={workspace}
                isActive={activeWorkspace?.id === workspace.id}
                onSelect={handleSelectWorkspace}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Pro Banner for Free users */}
      {(!user?.plan || user?.plan === 'free' || user?.plan === 'Free') && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-base md:text-lg">
                  {t('dashboard.upgradeBanner.title', 'Nâng cấp lên Pro')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.upgradeBanner.description', 'Mở khóa không giới hạn tài liệu và tính năng AI chuyên sâu')}
                </p>
              </div>
            </div>
            <Button className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0" asChild>
              <Link to={PATHS.SETTINGS.SUBSCRIPTION}>
                <Sparkles className="w-4 h-4 mr-2" />
                {t('common.upgradeNow', 'Nâng cấp ngay')}
              </Link>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
export default DashboardHomePage;
