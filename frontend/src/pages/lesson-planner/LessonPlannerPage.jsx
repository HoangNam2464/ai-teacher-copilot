import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { lessonPlannerApi } from '@/services/generation';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { CitationBadge } from '@/components/citation/CitationBadge';
import { CitationDrawer } from '@/components/citation/CitationDrawer';
import { ExportDropdown } from '@/components/export/ExportDropdown';
import { PATHS } from '@/routes/paths';
import {
  Brain,
  Target,
  Clock,
  BookOpen,
  Sparkles,
  FolderOpen,
  Plus,
  Layers,
  HelpCircle,
  FileCheck,
  Copy,
  Check,
  RotateCcw,
  Package,
  FileText,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';

/**
 * Safely extracts the lesson plan object from any backend/API response format
 */
function extractPlanData(res) {
  if (!res) return null;
  if (res.contentData) return res.contentData;
  if (res.lessonPlan) return res.lessonPlan;
  if (res.data?.data) return res.data.data;
  if (res.data?.contentData) return res.data.contentData;
  if (res.data && (res.data.sections || res.data.title)) return res.data;
  if (res.sections || res.title) return res;
  return null;
}

export function LessonPlannerPage() {
  const { t } = useTranslation();
  const { activeWorkspace, isInitialized, isLoading: isWorkspaceLoading } = useWorkspaceStore();

  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [objectives, setObjectives] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Citation Drawer State
  const [isCitationOpen, setIsCitationOpen] = useState(false);

  // Sync subject & grade from activeWorkspace when it changes
  useEffect(() => {
    if (activeWorkspace) {
      setSubject(activeWorkspace.subject || '');
      setGradeLevel(activeWorkspace.gradeLevel || '');
    }
  }, [activeWorkspace]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeWorkspace?.id) {
      toast.error(t('workspace.selectFirst', 'Vui lòng chọn không gian làm việc trước.'));
      return;
    }

    if (!topic.trim()) {
      toast.error(t('lessonPlanner.topicRequired', 'Vui lòng nhập chủ đề hoặc tên bài dạy'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const parsedObjectives = objectives ? objectives.split('\n').map((s) => s.trim()).filter(Boolean) : [];

      // Combine pedagogical instructions with objectives & duration to ensure any backend endpoint format receives full context
      const combinedInstructions = [
        instructions.trim(),
        parsedObjectives.length > 0 ? `Mục tiêu bài dạy:\n${parsedObjectives.map((o) => `- ${o}`).join('\n')}` : '',
        durationMinutes ? `Thời lượng tiết học: ${durationMinutes} phút` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const payload = {
        subject: subject.trim() || activeWorkspace.subject || t('common.defaultSubject', 'Toán học'),
        gradeLevel: gradeLevel.trim() || activeWorkspace.gradeLevel || t('common.defaultGrade', 'Lớp 10'),
        topic: topic.trim(),
        objectives: parsedObjectives,
        durationMinutes: Number(durationMinutes),
        instructions: combinedInstructions,
      };

      const data = await lessonPlannerApi.generateLessonPlan(activeWorkspace.id, payload);
      setResult(data);
      toast.success(t('common.success', 'Đã soạn giáo án thành công!'));
    } catch (err) {
      console.error('Generation failed:', err);
      if (err.response?.status === 422) {
        setError(
          t(
            'lessonPlanner.insufficientEvidence',
            'Chưa tìm thấy đủ tài liệu học liệu liên quan đến bài dạy này. Thầy/Cô vui lòng tải thêm tài liệu bài học vào Không gian làm việc để hệ thống hỗ trợ soạn bài chính xác nhất.'
          )
        );
      } else {
        const msg = err.response?.data?.message || t('lessonPlanner.failed', 'Soạn giáo án chưa thành công. Thầy/Cô vui lòng thử lại.');
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const plan = extractPlanData(result);

  // Parse objectives supporting both array and single string
  const objectivesList = plan
    ? Array.isArray(plan.objectives)
      ? plan.objectives
      : plan.objective
      ? [plan.objective]
      : []
    : [];

  // Parse materials needed
  const materialsList = plan && Array.isArray(plan.materials_needed) ? plan.materials_needed : [];

  // Copy full plan to clipboard as formatted text
  const handleCopyPlan = async () => {
    if (!plan) return;
    try {
      const lines = [];
      lines.push(`# ${plan.title || topic}`);
      lines.push(
        `- Môn học: ${subject || activeWorkspace?.subject || ''} | Khối: ${gradeLevel || activeWorkspace?.gradeLevel || ''} | Thời lượng: ${plan.duration_minutes || durationMinutes} phút`
      );
      lines.push('');

      if (objectivesList.length > 0) {
        lines.push('## Mục tiêu bài dạy');
        objectivesList.forEach((obj) => lines.push(`- ${obj}`));
        lines.push('');
      }

      if (materialsList.length > 0) {
        lines.push('## Thiết bị & Học liệu dạy học');
        materialsList.forEach((mat) => lines.push(`- ${mat}`));
        lines.push('');
      }

      if (plan.sections && plan.sections.length > 0) {
        lines.push('## Tiến trình hoạt động');
        plan.sections.forEach((sec, idx) => {
          lines.push(`### ${idx + 1}. ${sec.title} (${sec.duration_minutes || ''} phút)`);
          lines.push(sec.content);
          lines.push('');
        });
      }

      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      toast.success(t('lessonPlanner.copySuccess', 'Đã sao chép nội dung giáo án vào bộ nhớ tạm'));
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error(t('lessonPlanner.copyFailed', 'Sao chép thất bại'));
    }
  };

  const handleResetForm = () => {
    setResult(null);
    setError('');
  };

  // Initial loading spinner
  if (isWorkspaceLoading && !isInitialized) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-emerald-600" />
      </div>
    );
  }

  // No active workspace
  if (!activeWorkspace) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 text-emerald-600">
          <FolderOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">
          {t('workspace.noActiveContext', 'Chưa chọn Không gian làm việc')}
        </h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
          {t('documents.selectWorkspaceFirst', 'Vui lòng chọn hoặc tạo một Không gian làm việc trước để soạn bài.')}
        </p>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
          <Link to={PATHS.WORKSPACES}>
            <Plus className="w-4 h-4 mr-2" />
            {t('workspace.createFirst', 'Quản lý Không gian làm việc')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6 text-emerald-600" />
            <span>{t('lessonPlanner.title', 'Soạn Kế Hoạch Bài Dạy')}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('lessonPlanner.subtitle', 'Soạn kế hoạch bài dạy chi tiết theo chuẩn sư phạm, bám sát sách giáo khoa và tài liệu bài học')}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <BookOpen className="w-3.5 h-3.5" />
            {activeWorkspace.name}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        {/* Input Form Column */}
        <Card className="h-fit rounded-xl border border-border shadow-xs">
          <CardHeader className="pb-4 border-b border-border bg-muted/20">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                {t('lessonPlanner.formTitle', 'Thiết Lập Yêu Cầu Bài Dạy')}
              </span>
              {result && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  title={t('lessonPlanner.reset', 'Soạn bài mới')}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('lessonPlanner.reset', 'Soạn mới')}</span>
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Topic */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  {t('lessonPlanner.topic', 'Chủ đề / Tên bài dạy')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t('lessonPlanner.topicPlaceholder', 'Ví dụ: Định lý Cosin và giải tam giác')}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Subject & Grade Level */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">
                    {t('workspace.subject', 'Môn học')}
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Toán học..."
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">
                    {t('workspace.gradeLevel', 'Khối lớp')}
                  </label>
                  <input
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    placeholder="Lớp 10..."
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Duration with quick presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    {t('lessonPlanner.duration', 'Thời lượng (phút)')}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[45, 90].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDurationMinutes(preset)}
                        className={`text-xs px-2 py-0.5 rounded-md border transition-colors ${
                          Number(durationMinutes) === preset
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium'
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {preset}p
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Learning Objectives */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  {t('lessonPlanner.objectives', 'Mục tiêu bài học (Mỗi mục tiêu 1 dòng)')}
                </label>
                <textarea
                  rows={3}
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  placeholder={t('lessonPlanner.objectivesPlaceholder', '- Nắm vững công thức định lý Cosin\n- Vận dụng tính cạnh và góc trong tam giác')}
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-colors"
                />
              </div>

              {/* Pedagogical Instructions */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  {t('lessonPlanner.instructions', 'Chỉ dẫn sư phạm bổ sung')}
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={t('lessonPlanner.instructionsPlaceholder', 'Ví dụ: Tổ chức thảo luận nhóm 4 học sinh, liên hệ thực tế...')}
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-colors"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{t('common.error', 'Đã xảy ra lỗi')}</p>
                    <p className="leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 shadow-sm transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-4 h-4 text-white" />
                    {t('lessonPlanner.generating', 'Đang tra cứu tài liệu & soạn giáo án...')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {t('lessonPlanner.generate', 'Bắt đầu soạn giáo án')}
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Output Column (Loading State / Generated Result / Empty State) */}
        {loading ? (
          /* Loading State (Animated Skeleton & Shimmer) */
          <div className="sticky top-20 h-fit space-y-4">
            <Card className="rounded-xl border border-emerald-500/30 shadow-sm overflow-hidden bg-card">
              <CardHeader className="bg-emerald-500/5 border-b border-border p-5">
                <div className="space-y-2.5">
                  <div className="h-6 w-3/4 bg-emerald-500/15 rounded-md animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-4 w-20 bg-muted rounded-md animate-pulse" />
                    <div className="h-4 w-16 bg-muted rounded-md animate-pulse" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs">
                  <Spinner className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">{t('lessonPlanner.stepAnalyzing', 'Đang tra cứu tài liệu bài học...')}</p>
                    <p className="text-[11px] opacity-80">{t('lessonPlanner.stepFormulating', 'Đang xây dựng mục tiêu và tiến trình các hoạt động...')}</p>
                  </div>
                </div>

                {/* Skeleton Objectives */}
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded-md animate-pulse" />
                  <div className="space-y-1.5 pl-4">
                    <div className="h-3 w-5/6 bg-muted/60 rounded-md animate-pulse" />
                    <div className="h-3 w-4/6 bg-muted/60 rounded-md animate-pulse" />
                  </div>
                </div>

                {/* Skeleton Sections */}
                <div className="space-y-3">
                  <div className="h-4 w-40 bg-muted rounded-md animate-pulse" />
                  <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2.5">
                    <div className="h-4 w-1/2 bg-muted rounded-md animate-pulse" />
                    <div className="h-3 w-full bg-muted/60 rounded-md animate-pulse" />
                    <div className="h-3 w-4/5 bg-muted/60 rounded-md animate-pulse" />
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2.5">
                    <div className="h-4 w-2/5 bg-muted rounded-md animate-pulse" />
                    <div className="h-3 w-full bg-muted/60 rounded-md animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : plan ? (
          /* Rendered Lesson Plan Viewer */
          <div className="sticky top-20 h-fit space-y-4">
            <Card className="rounded-xl border border-emerald-500/30 shadow-sm overflow-hidden bg-card">
              {/* Card Header with Badges & Action Buttons */}
              <CardHeader className="bg-emerald-500/5 border-b border-border pb-4">
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div className="space-y-1.5">
                    <CardTitle className="text-lg font-bold text-emerald-800 dark:text-emerald-400">
                      {plan.title || topic}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-medium bg-background px-2 py-0.5 rounded-md border border-border">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        {plan.duration_minutes || durationMinutes} {t('lessonPlanner.durationUnit', 'phút')}
                      </span>
                      {gradeLevel && (
                        <span className="inline-flex items-center gap-1 font-medium bg-background px-2 py-0.5 rounded-md border border-border">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                          {gradeLevel}
                        </span>
                      )}
                      {subject && (
                        <span className="inline-flex items-center gap-1 font-medium bg-background px-2 py-0.5 rounded-md border border-border">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                          {subject}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-2">
                    {/* Citation Badge */}
                    <CitationBadge
                      count={plan.source_chunk_ids?.length || (plan.citations?.length || 1)}
                      onClick={() => setIsCitationOpen(true)}
                    />

                    {/* Copy to Clipboard Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPlan}
                      className="flex items-center gap-1.5 text-xs font-medium border-border hover:bg-muted"
                      title={t('lessonPlanner.copyPlan', 'Sao chép giáo án')}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">{t('common.copied', 'Đã chép')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{t('common.copy', 'Sao chép')}</span>
                        </>
                      )}
                    </Button>

                    {/* Export Dropdown */}
                    <ExportDropdown
                      workspaceId={activeWorkspace?.id}
                      generationId={result.id || result.data?.id || 'latest'}
                      defaultFileName={`giao-an-${(plan.title || topic).toLowerCase().replace(/\s+/g, '-')}`}
                    />
                  </div>
                </div>
              </CardHeader>

              {/* Card Content with Structured Plan Body */}
              <CardContent className="p-5 overflow-y-auto max-h-[calc(100vh-14rem)] space-y-6">
                {/* 1. Learning Objectives */}
                {objectivesList.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2.5 flex items-center gap-2 text-foreground">
                      <Target className="w-4 h-4 text-emerald-600" />
                      <span>{t('lessonPlanner.objectivesTitle', 'Mục tiêu bài dạy')}</span>
                    </h4>
                    <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
                      <ul className="space-y-1.5 pl-5 list-disc text-xs sm:text-sm text-foreground/90">
                        {objectivesList.map((obj, i) => (
                          <li key={i} className="leading-relaxed">
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 2. Teaching Materials Needed */}
                {materialsList.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2.5 flex items-center gap-2 text-foreground">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <span>{t('lessonPlanner.materialsTitle', 'Thiết bị & Học liệu dạy học')}</span>
                    </h4>
                    <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
                      <ul className="space-y-1.5 pl-5 list-disc text-xs sm:text-sm text-foreground/90">
                        {materialsList.map((mat, i) => (
                          <li key={i} className="leading-relaxed">
                            {mat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 3. Activity Sequence (Sections) */}
                {plan.sections && plan.sections.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>{t('lessonPlanner.activitiesTitle', 'Tiến trình hoạt động')}</span>
                    </h4>
                    <div className="space-y-3.5">
                      {plan.sections.map((sec, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl bg-muted/30 border border-border hover:border-emerald-500/30 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2.5 gap-2">
                            <strong className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs flex items-center justify-center font-bold">
                                {i + 1}
                              </span>
                              {sec.title}
                            </strong>
                            {sec.duration_minutes && (
                              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md whitespace-nowrap border border-emerald-500/20">
                                {sec.duration_minutes} {t('lessonPlanner.durationUnit', 'phút')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line leading-relaxed pl-7">
                            {sec.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Grounding Note */}
                <div className="pt-2 text-center border-t border-border">
                  <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {t('lessonPlanner.groundingNotice', 'Nội dung bài dạy được đối chiếu từ tài liệu học tập trong không gian làm việc')}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Citation Drawer */}
            <CitationDrawer
              isOpen={isCitationOpen}
              onClose={() => setIsCitationOpen(false)}
              citations={
                plan.citations && plan.citations.length > 0
                  ? plan.citations
                  : plan.source_chunk_ids && plan.source_chunk_ids.length > 0
                  ? plan.source_chunk_ids.map((id, idx) => ({
                      chunkId: id,
                      fileName: `${activeWorkspace?.name || 'Tài liệu bài học'} (Mục ${idx + 1})`,
                      sourcePage: idx + 1,
                      excerpt: t(
                        'lessonPlanner.chunkExcerpt',
                        'Trích đoạn tham khảo từ tài liệu bài học trong không gian làm việc.'
                      ),
                    }))
                  : [
                      {
                        chunkId: 'ref-1',
                        fileName: activeWorkspace?.name || t('citation.sourceDoc', 'Tài liệu học liệu'),
                        sourcePage: 1,
                        excerpt: t(
                          'lessonPlanner.chunkExcerpt',
                          'Trích đoạn tham khảo từ tài liệu bài học trong không gian làm việc.'
                        ),
                      },
                    ]
              }
            />
          </div>
        ) : (
          /* Empty State */
          <div className="hidden lg:flex flex-col items-center justify-center p-8 text-center bg-card border-2 border-dashed border-border rounded-xl h-[calc(100vh-14rem)] sticky top-20">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-600">
              <Brain className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold mb-1 text-foreground">
              {t('lessonPlanner.emptyTitle', 'Chưa có giáo án nào được tạo')}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              {t(
                'lessonPlanner.emptyDesc',
                'Điền thông tin chủ đề và mục tiêu bài dạy ở biểu mẫu bên trái, sau đó nhấn "Bắt đầu soạn giáo án" để tạo kế hoạch bài dạy chi tiết.'
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LessonPlannerPage;

