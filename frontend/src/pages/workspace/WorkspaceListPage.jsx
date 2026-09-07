import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { workspaceApi } from '@/services/workspace';
import { WorkspaceCard } from '@/components/workspace/WorkspaceCard';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuth } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';
import { Spinner } from '@/components/ui/Spinner';
import { 
  FolderOpen, 
  Brain, 
  FileText, 
  UploadCloud, 
  Plus, 
  ArrowRight,
  Library
} from 'lucide-react';

function getGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return 'dashboard.greeting.morning';
  if (hour < 17) return 'dashboard.greeting.afternoon';
  return 'dashboard.greeting.evening';
}

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ icon: Icon, title, description, href, color }) {
  return (
    <Link
      to={href}
      className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all group animate-fade-in"
    >
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}

export function WorkspaceListPage() {
  const { t } = useTranslation();
  const { workspaces, activeWorkspace, setWorkspaces, setActiveWorkspace } = useWorkspace();
  const { displayName } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [description, setDescription] = useState('');

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await workspaceApi.getWorkspaces();
      setWorkspaces(data);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
      // Removed toast.error to avoid annoying popup during UI development when backend is down
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setLoading(true);
      await workspaceApi.createWorkspace({ name, subject, gradeLevel, description });
      setName('');
      setSubject('');
      setGradeLevel('');
      setDescription('');
      setIsCreating(false);
      toast.success(t('workspace.createSuccess'));
      await loadWorkspaces();
    } catch {
      toast.error(t('workspace.errorCreate'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('workspace.deleteConfirm'))) return;
    try {
      await workspaceApi.deleteWorkspace(id);
      toast.success(t('workspace.deleteSuccess'));
      await loadWorkspaces();
    } catch {
      toast.error(t('workspace.errorDelete'));
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome section */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              {t(getGreetingKey())}, {displayName?.split(' ').pop() || t('dashboard.user')} <span className="inline-block animate-float origin-[70%_70%]">👋</span>
            </h1>
            <p className="text-muted-foreground">
              {activeWorkspace 
                ? t('workspace.activeContext') + activeWorkspace.name
                : t('workspace.noActiveContext')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={FolderOpen}
          value={workspaces.length}
          label={t('workspace.stats.total')}
          color="bg-primary/10 text-primary"
        />
        {/* Placeholder structural cards omitted as per constraint to avoid fake metrics */}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">{t('workspace.quickActions.title')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            icon={Brain}
            title={t('workspace.quickActions.newLesson')}
            description={t('workspace.quickActions.newLessonDesc')}
            href={PATHS.LESSON_PLANNER}
            color="bg-emerald-500/10 text-emerald-500"
          />
          <QuickActionCard
            icon={FileText}
            title={t('workspace.quickActions.newQuiz')}
            description={t('workspace.quickActions.newQuizDesc')}
            href={PATHS.QUIZ_GENERATOR}
            color="bg-blue-500/10 text-blue-500"
          />
          <QuickActionCard
            icon={UploadCloud}
            title={t('workspace.quickActions.uploadDoc')}
            description={t('workspace.quickActions.uploadDocDesc')}
            href={PATHS.DOCUMENTS}
            color="bg-purple-500/10 text-purple-500"
          />
        </div>
      </div>

      {/* Recent Workspaces */}
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('workspace.recent')}</h2>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isCreating
                ? 'bg-muted text-foreground hover:bg-muted/80'
                : 'bg-primary text-primary-foreground hover:opacity-90'
            }`}
          >
            {isCreating ? t('workspace.cancel') : <><Plus className="w-4 h-4"/> {t('workspace.create')}</>}
          </button>
        </div>

        {/* Create form */}
        {isCreating && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6 animate-fade-in">
            <h3 className="text-base font-semibold mb-4">{t('workspace.createTitle')}</h3>
            <form onSubmit={handleCreate}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t('workspace.name')} <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    placeholder={t('workspace.namePlaceholder')}
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t('workspace.subject')}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    placeholder={t('workspace.subjectPlaceholder')}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t('workspace.gradeLevel')}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    placeholder={t('workspace.gradePlaceholder')}
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('workspace.description')}
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-shadow resize-none"
                  rows={2}
                  placeholder={t('workspace.descriptionPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? t('common.saving') : t('workspace.save')}
              </button>
            </form>
          </div>
        )}

        {/* Content */}
        {loading && workspaces.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Spinner message={t('common.loading')} />
          </div>
        ) : workspaces.length === 0 && !isCreating ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Library className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('workspace.empty')}</h3>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              {t('workspace.emptyDesc')}
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4"/> {t('workspace.createFirst')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((w) => (
              <WorkspaceCard
                key={w.id}
                workspace={w}
                isActive={activeWorkspace?.id === w.id}
                onSelect={setActiveWorkspace}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

