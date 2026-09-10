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
} from 'lucide-react';

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
      toast.error('Vui lòng nhập chủ đề hoặc tên bài dạy');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const payload = {
        subject: subject.trim() || activeWorkspace.subject || t('common.defaultSubject', 'Toán học'),
        gradeLevel: gradeLevel.trim() || activeWorkspace.gradeLevel || t('common.defaultGrade', 'Lớp 10'),
        topic: topic.trim(),
        objectives: objectives ? objectives.split('\n').filter((s) => s.trim()) : [],
        durationMinutes: Number(durationMinutes),
        instructions: instructions.trim(),
      };

      const data = await lessonPlannerApi.generateLessonPlan(activeWorkspace.id, payload);
      setResult(data);
      toast.success(t('common.success', 'Đã sinh giáo án thành công!'));
    } catch (err) {
      console.error('Generation failed:', err);
      if (err.response?.status === 422) {
        setError(t('lessonPlanner.insufficientEvidence', 'Hệ thống không tìm thấy đủ tài liệu liên quan trong kho tri thức để soạn giáo án này (Insufficient Evidence). Vui lòng nạp thêm tài liệu.'));
      } else {
        const msg = err.response?.data?.message || t('lessonPlanner.failed', 'Sinh giáo án thất bại. Vui lòng thử lại.');
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const plan = result?.contentData || result?.lessonPlan;

  // Initial loading spinner
  if (isWorkspaceLoading && !isInitialized) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-green-600" />
      </div>
    );
  }

  // No active workspace
  if (!activeWorkspace) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4 text-green-600">
          <FolderOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">
          {t('workspace.noActiveContext', 'Chưa chọn Không gian làm việc')}
        </h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
          {t('documents.selectWorkspaceFirst', 'Vui lòng chọn hoặc tạo một Không gian làm việc trước để soạn bài.')}
        </p>
        <Button className="bg-green-600 hover:bg-green-700 text-white" asChild>
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('lessonPlanner.title', 'Soạn Giáo Án AI')}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('lessonPlanner.subtitle', 'Sinh kế hoạch bài dạy có cấu trúc bám sát tài liệu nguồn được trích xuất từ RAG')}
          {' • '}
          <span className="text-foreground font-medium">{activeWorkspace.name}</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Input Form */}
        <Card className="h-fit rounded-xl border border-border">
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-green-600" />
              <span>{t('lessonPlanner.formTitle', 'Thiết Lập Yêu Cầu Soạn Bài')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('lessonPlanner.topic', 'Chủ đề / Tên bài dạy')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t('lessonPlanner.topicPlaceholder', 'Ví dụ: Định lý Cosin và giải tam giác')}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t('workspace.subject', 'Môn học')}
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Toán học..."
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t('workspace.gradeLevel', 'Khối lớp')}
                  </label>
                  <input
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    placeholder="Lớp 10..."
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('lessonPlanner.duration', 'Thời lượng (phút)')}
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('lessonPlanner.objectives', 'Mục tiêu bài học (Mỗi mục tiêu 1 dòng)')}
                </label>
                <textarea
                  rows={3}
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  placeholder={t('lessonPlanner.objectivesPlaceholder', '- Nắm vững công thức\n- Áp dụng vào bài tập')}
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('lessonPlanner.instructions', 'Chỉ dẫn sư phạm bổ sung')}
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={t('lessonPlanner.instructionsPlaceholder', 'Ví dụ: Tăng cường hoạt động nhóm...')}
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-4 h-4 text-white" />
                    {t('lessonPlanner.generating', 'Đang phân tích dữ liệu & sinh giáo án...')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {t('lessonPlanner.generate', 'Bắt đầu sinh giáo án AI')}
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Output Preview */}
        {result && plan ? (
          <div className="sticky top-20 h-fit space-y-4">
            <Card className="rounded-xl border border-green-500/30 shadow-sm overflow-hidden">
              <CardHeader className="bg-green-500/5 border-b border-border pb-4">
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div>
                    <CardTitle className="text-lg font-bold text-green-700 dark:text-green-400">
                      {plan.title || topic}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {plan.duration_minutes || durationMinutes} {t('lessonPlanner.durationUnit', 'phút')}
                      {gradeLevel && ` • ${gradeLevel}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CitationBadge
                      count={plan.source_chunk_ids?.length || 0}
                      onClick={() => setIsCitationOpen(true)}
                    />
                    <ExportDropdown
                      workspaceId={activeWorkspace?.id}
                      generationId={result.id}
                      defaultFileName={`giao-an-${topic}`}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 overflow-y-auto max-h-[calc(100vh-14rem)] space-y-5">
                {plan.objectives && plan.objectives.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground">
                      <Target className="w-4 h-4 text-green-600" />
                      <span>{t('lessonPlanner.objectivesTitle', 'Mục tiêu bài dạy')}</span>
                    </h4>
                    <ul className="space-y-1.5 pl-5 list-disc text-xs sm:text-sm text-muted-foreground">
                      {plan.objectives.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.sections && plan.sections.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                      <Layers className="w-4 h-4 text-green-600" />
                      <span>{t('lessonPlanner.activitiesTitle', 'Tiến trình hoạt động')}</span>
                    </h4>
                    <div className="space-y-3">
                      {plan.sections.map((sec, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl bg-muted/40 border border-border"
                        >
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <strong className="text-sm font-semibold text-foreground">{sec.title}</strong>
                            {sec.duration_minutes && (
                              <span className="text-[11px] font-semibold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-md whitespace-nowrap">
                                {sec.duration_minutes} {t('lessonPlanner.durationUnit', 'phút')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                            {sec.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <CitationDrawer
              isOpen={isCitationOpen}
              onClose={() => setIsCitationOpen(false)}
              citations={plan.source_chunk_ids?.map((id) => ({
                chunkId: id,
                fileName: t('citation.sourceDoc', 'Tài liệu nguồn'),
                excerpt: t('lessonPlanner.chunkExcerpt', 'Nội dung trích xuất từ tài liệu qua RAG vector search.')
              }))}
            />
          </div>
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center p-8 text-center bg-card border-2 border-dashed border-border rounded-xl h-[calc(100vh-14rem)] sticky top-20">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4 text-green-600">
              <Brain className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold mb-1">
              {t('lessonPlanner.emptyTitle', 'Chưa có giáo án nào được tạo')}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {t('lessonPlanner.emptyDesc', 'Điền thông tin chủ đề và mục tiêu bài dạy ở biểu mẫu bên trái, sau đó nhấn "Bắt đầu sinh giáo án AI".')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LessonPlannerPage;
