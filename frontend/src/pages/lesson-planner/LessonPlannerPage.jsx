import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { lessonPlannerApi } from '@/services/generation';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import { lessonStorage } from '@/utils/lessonStorage';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { InlineLessonEditor } from '@/components/lesson-planner/InlineLessonEditor';
import { CitationDrawer } from '@/components/citation/CitationDrawer';
import { PATHS } from '@/routes/paths';
import {
  Brain,
  BookOpen,
  Sparkles,
  FolderOpen,
  Plus,
  RotateCcw,
  FileText,
  AlertCircle,
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
  const [editedPlan, setEditedPlan] = useState(null);
  const [copied, setCopied] = useState(false);

  // Citation Drawer State
  const [isCitationOpen, setIsCitationOpen] = useState(false);

  // Auto-Save callback: persists to localStorage and attempts backend sync
  const handleAutoSave = async (currentPlan) => {
    if (!activeWorkspace?.id || !currentPlan) return;

    const formState = {
      topic,
      subject,
      gradeLevel,
      objectives,
      durationMinutes,
      instructions,
    };

    // 1. Primary persistence: localStorage for instant recovery upon page refresh
    lessonStorage.saveDraft(activeWorkspace.id, {
      result: {
        ...(result || {}),
        contentData: currentPlan,
        lessonPlan: currentPlan,
      },
      plan: currentPlan,
      form: formState,
    });

    // 2. Secondary persistence: attempt backend update if generationId is available
    const generationId = result?.id || result?.data?.id;
    if (generationId && generationId !== 'latest') {
      try {
        await lessonPlannerApi.updateLessonPlan(activeWorkspace.id, generationId, {
          contentData: currentPlan,
        });
      } catch (err) {
        // Backend PUT may not be present yet; draft is safely preserved in localStorage
        console.warn('Backend update failed, draft safely preserved locally:', err);
      }
    }
  };

  const autoSaveState = useAutoSave({
    data: editedPlan,
    onSave: handleAutoSave,
    delay: 1200,
    enabled: !!editedPlan && !!activeWorkspace?.id,
  });

  // Restore draft from localStorage upon mount or when activeWorkspace changes
  useEffect(() => {
    if (activeWorkspace?.id) {
      const draft = lessonStorage.getDraft(activeWorkspace.id);
      if (draft && draft.plan) {
        setResult(draft.result || { contentData: draft.plan });
        setEditedPlan(draft.plan);
        if (draft.form) {
          if (draft.form.topic) setTopic(draft.form.topic);
          if (draft.form.subject) setSubject(draft.form.subject);
          if (draft.form.gradeLevel) setGradeLevel(draft.form.gradeLevel);
          if (draft.form.objectives) setObjectives(draft.form.objectives);
          if (draft.form.durationMinutes) setDurationMinutes(draft.form.durationMinutes);
          if (draft.form.instructions) setInstructions(draft.form.instructions);
        }
        autoSaveState.markSaved(draft.savedAt ? new Date(draft.savedAt) : new Date());
        toast.info(t('lessonPlanner.restoredDraft', 'Đã khôi phục bản thảo bài dạy gần nhất'));
      } else {
        // Fallback sync subject & grade from activeWorkspace
        setSubject(activeWorkspace.subject || '');
        setGradeLevel(activeWorkspace.gradeLevel || '');
      }
    }
  }, [activeWorkspace?.id]);

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
      setEditedPlan(null);

      const parsedObjectives = objectives ? objectives.split('\n').map((s) => s.trim()).filter(Boolean) : [];

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
      const extracted = extractPlanData(data);
      setResult(data);
      setEditedPlan(extracted);

      // Immediately persist newly generated plan
      lessonStorage.saveDraft(activeWorkspace.id, {
        result: data,
        plan: extracted,
        form: {
          topic,
          subject,
          gradeLevel,
          objectives,
          durationMinutes,
          instructions,
        },
      });
      autoSaveState.markSaved();

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

  const activePlan = editedPlan || extractPlanData(result);

  // Copy full plan to clipboard as formatted text
  const handleCopyPlan = async () => {
    if (!activePlan) return;
    try {
      const lines = [];
      lines.push(`# ${activePlan.title || topic}`);
      lines.push(
        `- Môn học: ${subject || activeWorkspace?.subject || ''} | Khối: ${gradeLevel || activeWorkspace?.gradeLevel || ''} | Thời lượng: ${activePlan.duration_minutes || durationMinutes} phút`
      );
      lines.push('');

      const objList = Array.isArray(activePlan.objectives)
        ? activePlan.objectives
        : activePlan.objective
        ? [activePlan.objective]
        : [];

      if (objList.length > 0) {
        lines.push('## Mục tiêu bài dạy');
        objList.forEach((obj) => lines.push(`- ${obj}`));
        lines.push('');
      }

      const matList = Array.isArray(activePlan.materials_needed) ? activePlan.materials_needed : [];
      if (matList.length > 0) {
        lines.push('## Thiết bị & Học liệu dạy học');
        matList.forEach((mat) => lines.push(`- ${mat}`));
        lines.push('');
      }

      if (activePlan.sections && activePlan.sections.length > 0) {
        lines.push('## Tiến trình hoạt động');
        activePlan.sections.forEach((sec, idx) => {
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
    if (activeWorkspace?.id) {
      lessonStorage.clearDraft(activeWorkspace.id);
    }
    setResult(null);
    setEditedPlan(null);
    setError('');
    autoSaveState.resetStatus();
    toast.success(t('lessonPlanner.resetSuccess', 'Đã tạo bản soạn mới'));
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
              {activePlan && (
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

              {/* Duration Minutes */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  {t('lessonPlanner.duration', 'Thời lượng tiết học')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="15"
                    max="180"
                    step="5"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-32 px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                  />
                  <span className="text-sm text-muted-foreground">{t('lessonPlanner.durationUnit', 'phút')}</span>
                </div>
              </div>

              {/* Objectives */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  {t('lessonPlanner.objectives', 'Mục tiêu bài dạy')}
                </label>
                <textarea
                  rows={3}
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  placeholder={t(
                    'lessonPlanner.objectivesPlaceholder',
                    'Nhập mục tiêu bài dạy (mỗi dòng một mục tiêu)...'
                  )}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Pedagogical Instructions */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  {t('lessonPlanner.instructions', 'Yêu cầu / Hướng dẫn sư phạm bổ sung')}
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={t(
                    'lessonPlanner.instructionsPlaceholder',
                    'Ví dụ: Tập trung vào hoạt động nhóm và ví dụ thực tế liên môn...'
                  )}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg shadow-sm hover:shadow transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-4 h-4 text-white" />
                    {t('lessonPlanner.generating', 'Đang soạn bài dạy...')}
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
        ) : activePlan ? (
          /* Rendered Lesson Plan Viewer with Inline Editor & Auto-Save */
          <div className="sticky top-20 h-fit space-y-4">
            <InlineLessonEditor
              plan={activePlan}
              onChange={setEditedPlan}
              autoSaveState={autoSaveState}
              workspaceName={activeWorkspace?.name}
              workspaceId={activeWorkspace?.id}
              generationId={result?.id || result?.data?.id || 'latest'}
              subject={subject || activeWorkspace?.subject}
              gradeLevel={gradeLevel || activeWorkspace?.gradeLevel}
              durationMinutes={durationMinutes}
              copied={copied}
              onCopy={handleCopyPlan}
              onOpenCitation={() => setIsCitationOpen(true)}
              citationCount={activePlan.source_chunk_ids?.length || (activePlan.citations?.length || 1)}
            />

            {/* Citation Drawer */}
            <CitationDrawer
              isOpen={isCitationOpen}
              onClose={() => setIsCitationOpen(false)}
              citations={
                activePlan.citations && activePlan.citations.length > 0
                  ? activePlan.citations
                  : activePlan.source_chunk_ids && activePlan.source_chunk_ids.length > 0
                  ? activePlan.source_chunk_ids.map((id, idx) => ({
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
