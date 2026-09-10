import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { quizApi } from '@/services/generation';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { BloomTaxonomyTag } from '@/components/ui/BloomTaxonomyTag';
import { CitationBadge } from '@/components/citation/CitationBadge';
import { CitationDrawer } from '@/components/citation/CitationDrawer';
import { ExportDropdown } from '@/components/export/ExportDropdown';
import { PATHS } from '@/routes/paths';
import {
  FileQuestion,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  FolderOpen,
  Plus,
  BookOpen,
  Layers,
  Target,
  HelpCircle,
} from 'lucide-react';
import { APP_CONFIG } from '@/config/appConfig';

export function QuizGeneratorPage() {
  const { t } = useTranslation();
  const { activeWorkspace, isInitialized, isLoading: isWorkspaceLoading } = useWorkspaceStore();

  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [targetBloomLevel, setTargetBloomLevel] = useState('Understand');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Citation Drawer State
  const [isCitationOpen, setIsCitationOpen] = useState(false);
  const [activeCitations, setActiveCitations] = useState([]);

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
      toast.error('Vui lòng nhập chủ đề hoặc bài học cần tạo câu hỏi.');
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
        numQuestions: Number(questionCount),
        questionCount: Number(questionCount),
        difficulty,
        targetBloomLevel,
        instructions: instructions.trim(),
      };

      const res = await quizApi.generateQuiz(activeWorkspace.id, payload);
      const quizData = res?.data?.data || res?.data || res;
      setResult(quizData);
      toast.success(t('common.success', 'Đã tạo bộ câu hỏi kiểm tra thành công!'));
    } catch (err) {
      console.error('Quiz generation failed:', err);
      if (err.response?.status === 422) {
        const msg = t(
          'quizGenerator.insufficientEvidence',
          'Hệ thống không tìm thấy đủ tài liệu trong kho tri thức để tạo đề kiểm tra này. Vui lòng nạp thêm tài liệu liên quan.'
        );
        setError(msg);
        toast.error(msg);
      } else {
        const msg = err.response?.data?.message || t('quizGenerator.failed', 'Tạo đề kiểm tra thất bại. Vui lòng thử lại.');
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Resolve actual quiz object safely
  const quiz =
    result?.questions ? result :
    result?.data?.questions ? result.data :
    result?.contentData || result?.quiz;

  // Initial loading spinner
  if (isWorkspaceLoading && !isInitialized) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner message={t('common.loading', 'Đang tải dữ liệu...')} />
      </div>
    );
  }

  // If no active workspace
  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4 text-orange-600">
          <FolderOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2">
          {t('quizGenerator.selectWorkspaceFirst', 'Chưa chọn không gian làm việc')}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mb-6">
          {t(
            'quizGenerator.emptyDesc',
            'Vui lòng chọn hoặc tạo một không gian làm việc để bắt đầu tạo câu hỏi trắc nghiệm.'
          )}
        </p>
        <Link to={PATHS.WORKSPACES}>
          <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium shadow-md shadow-emerald-500/15">
            <Plus className="w-4 h-4" />
            {t('workspace.createFirst', 'Quản lý không gian làm việc')}
          </Button>
        </Link>
      </div>
    );
  }

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('quizGenerator.title', 'Tạo bài tập & Đề kiểm tra')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('quizGenerator.subtitle', 'Tạo câu hỏi trắc nghiệm chuẩn Bloom dựa trên kho tài liệu đã tải lên.')}
          </p>
        </div>

        {activeWorkspace && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 border border-border text-xs text-muted-foreground w-fit">
            <FolderOpen className="w-4 h-4 text-primary" />
            <span>{t('workspace.title', 'Không gian')}:</span>
            <strong className="text-foreground font-semibold">{activeWorkspace.name}</strong>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* Input Form */}
        <Card className="h-fit">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-orange-500" />
              {t('quizGenerator.formTitle', 'Cấu hình bài kiểm tra')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Topic / Unit */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  {t('quizGenerator.topic', 'Chủ đề / Bài học')} <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
                  placeholder={t('quizGenerator.topicPlaceholder', 'Ví dụ: Đạo hàm cấp 1 và ứng dụng hình học')}
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              {/* Subject & Grade Level */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    {t('common.subject', 'Môn học')}
                  </label>
                  <input
                    type="text"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
                    placeholder={t('common.defaultSubject', 'Toán học')}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    {t('common.grade', 'Khối lớp')}
                  </label>
                  <input
                    type="text"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
                    placeholder={t('common.defaultGrade', 'Lớp 10')}
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                  />
                </div>
              </div>

              {/* Question Count & Difficulty */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {t('quizGenerator.questionCount', 'Số lượng câu hỏi')}
                  </label>
                  <div className="flex items-center gap-2">
                    {[3, 5, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionCount(num)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          Number(questionCount) === num
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-muted/40 hover:bg-muted text-muted-foreground border-input'
                        }`}
                      >
                        {num} câu
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {t('quizGenerator.difficulty', 'Độ khó')}
                  </label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    {APP_CONFIG.DIFFICULTY_LEVELS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.value === 'EASY'
                          ? t('quizGenerator.difficultyEasy', 'Dễ')
                          : d.value === 'MEDIUM'
                          ? t('quizGenerator.difficultyMedium', 'Trung bình')
                          : t('quizGenerator.difficultyHard', 'Nâng cao')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Bloom Taxonomy Level */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-orange-500" />
                    {t('quizGenerator.bloomFocus', 'Cấp độ Bloom trọng tâm')}
                  </span>
                  <BloomTaxonomyTag level={targetBloomLevel} />
                </label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
                  value={targetBloomLevel}
                  onChange={(e) => setTargetBloomLevel(e.target.value)}
                >
                  {APP_CONFIG.BLOOM_LEVELS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {t(`bloom.${b.value.toLowerCase()}`, b.value)} ({b.value})
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional Teacher Instructions */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center justify-between">
                  <span>{t('quizGenerator.instructions', 'Yêu cầu sư phạm bổ sung (tuỳ chọn)')}</span>
                </label>
                <textarea
                  className="flex min-h-[70px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all resize-none"
                  rows={2}
                  placeholder={t(
                    'quizGenerator.instructionsPlaceholder',
                    'Ví dụ: Trọng tâm vào bài toán thực tế, bẫy các lỗi học sinh hay nhầm lẫn dấu...'
                  )}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-start gap-2 border border-destructive/20">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 gap-2 text-base font-semibold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md shadow-orange-500/15"
              >
                <Sparkles className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                {loading
                  ? t('quizGenerator.generating', 'AI đang tạo đề kiểm tra...')
                  : t('quizGenerator.generate', 'Tạo đề kiểm tra với AI')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Output Preview */}
        {quiz ? (
          <div className="h-fit">
            <Card className="overflow-hidden border-orange-500/20 shadow-md shadow-orange-500/5">
              <CardHeader className="bg-orange-50/60 dark:bg-orange-950/20 border-b border-border pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl text-orange-800 dark:text-orange-400 font-bold">
                      {quiz.title || topic}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{t('quizGenerator.totalQuestions', 'Số câu')}: <strong className="text-foreground">{quiz.questions?.length || questionCount}</strong></span>
                      <span>•</span>
                      <span>{t('quizGenerator.difficulty', 'Độ khó')}: <strong className="text-foreground">{difficulty}</strong></span>
                    </p>
                  </div>
                  <ExportDropdown
                    workspaceId={activeWorkspace?.id}
                    generationId={result.id || 'current'}
                    defaultFileName={`de-thi-${topic || 'trac-nghiem'}`}
                  />
                </div>
              </CardHeader>

              <CardContent className="p-6 overflow-y-auto max-h-[calc(100vh-16rem)] space-y-6">
                {quiz.questions?.map((q, i) => {
                  const correctIdx = q.correct_answer_index;
                  const correctText =
                    q.correct_answer ||
                    q.correctAnswer ||
                    (correctIdx !== undefined && q.options?.[correctIdx]
                      ? `${optionLabels[correctIdx] || ''}. ${q.options[correctIdx]}`
                      : '');

                  return (
                    <div
                      key={i}
                      className="p-5 rounded-xl bg-card border border-border/80 shadow-xs hover:border-orange-500/30 transition-all"
                    >
                      {/* Question Header */}
                      <div className="flex justify-between items-start mb-4 gap-3">
                        <div className="flex items-start gap-2.5 flex-1">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 text-xs font-bold shrink-0 mt-0.5">
                            {q.question_number || i + 1}
                          </span>
                          <span className="text-sm font-semibold leading-relaxed text-foreground">
                            {q.question_text || q.question}
                          </span>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end shrink-0">
                          {q.bloom_taxonomy_level && (
                            <BloomTaxonomyTag level={q.bloom_taxonomy_level} />
                          )}
                          <CitationBadge
                            count={q.source_chunk_ids?.length || 1}
                            onClick={() => {
                              setActiveCitations(
                                q.source_chunk_ids?.map((id, idx) => ({
                                  chunkId: String(id || idx),
                                  fileName: activeWorkspace?.name || 'Tài liệu nguồn',
                                  excerpt: `Nguồn ngữ cảnh phục vụ sinh câu hỏi #${i + 1}`,
                                })) || [
                                  {
                                    chunkId: '1',
                                    fileName: 'Kho tri thức giáo viên',
                                    excerpt: 'Trích xuất trực tiếp từ các tài liệu được lập chỉ mục trong không gian làm việc.',
                                  },
                                ]
                              );
                              setIsCitationOpen(true);
                            }}
                          />
                        </div>
                      </div>

                      {/* Options Grid */}
                      {q.options && Array.isArray(q.options) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                          {q.options.map((opt, optIndex) => {
                            const isCorrect =
                              optIndex === correctIdx ||
                              opt === q.correct_answer ||
                              opt === q.correctAnswer;
                            const label = optionLabels[optIndex] || String.fromCharCode(65 + optIndex);
                            const text = typeof opt === 'string' ? opt : opt?.text || opt?.label;

                            return (
                              <div
                                key={optIndex}
                                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200 font-medium'
                                    : 'bg-muted/20 border-border text-foreground'
                                }`}
                              >
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {label}
                                </span>
                                <span className="leading-relaxed mt-0.5">{text}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation & Answer Key */}
                      <div className="pt-3 border-t border-dashed border-border/80 text-xs space-y-2">
                        {correctText && (
                          <div className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>
                              {t('quizGenerator.correctAnswer', 'Đáp án đúng')}: {correctText}
                            </span>
                          </div>
                        )}
                        {q.explanation && (
                          <div className="text-muted-foreground flex items-start gap-1.5 leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/40">
                            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-foreground font-medium">
                                {t('quizGenerator.explanation', 'Lời giải chi tiết')}:
                              </strong>{' '}
                              {q.explanation}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <CitationDrawer
              isOpen={isCitationOpen}
              onClose={() => setIsCitationOpen(false)}
              citations={activeCitations}
            />
          </div>
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center p-8 text-center bg-muted/20 border-2 border-dashed border-border rounded-2xl h-[calc(100vh-16rem)] sticky top-24">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
              <FileQuestion className="w-8 h-8 text-orange-500 opacity-80" />
            </div>
            <h3 className="text-base font-semibold mb-1 text-foreground">
              {t('quizGenerator.emptyTitle', 'Chưa có đề thi')}
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              {t(
                'quizGenerator.emptyDesc',
                'Điền chủ đề và cấu hình yêu cầu ở khung bên trái, sau đó nhấn "Tạo đề kiểm tra với AI" để sinh câu hỏi.'
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
