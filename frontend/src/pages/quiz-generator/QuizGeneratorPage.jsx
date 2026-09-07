import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { quizApi } from '@/services/generation';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BloomTaxonomyTag } from '@/components/ui/BloomTaxonomyTag';
import { CitationBadge } from '@/components/citation/CitationBadge';
import { CitationDrawer } from '@/components/citation/CitationDrawer';
import { ExportDropdown } from '@/components/export/ExportDropdown';
import { FileQuestion, AlertCircle, Sparkles, CheckCircle2, Lightbulb } from 'lucide-react';
import { APP_CONFIG } from '@/config/appConfig';

export function QuizGeneratorPage() {
  const { t } = useTranslation();
  const { activeWorkspace } = useWorkspace();
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [targetBloomLevel, setTargetBloomLevel] = useState('Understand');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Citation Drawer State
  const [isCitationOpen, setIsCitationOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeWorkspace?.id) {
      alert(t('workspace.selectFirst'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const payload = {
        subject: activeWorkspace.subject || 'Toán học',
        gradeLevel: activeWorkspace.gradeLevel || 'Lớp 10',
        topic,
        questionCount: Number(questionCount),
        difficulty,
        targetBloomLevel,
        instructions,
      };

      const data = await quizApi.generateQuiz(activeWorkspace.id, payload);
      setResult(data);
    } catch (err) {
      console.error('Quiz generation failed:', err);
      if (err.response?.status === 422) {
        setError(t('quizGenerator.insufficientEvidence'));
      } else {
        setError(err.response?.data?.message || t('quizGenerator.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const quiz = result?.contentData || result?.quiz;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('quizGenerator.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('quizGenerator.subtitle')}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* Input Form */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-orange-500" />
              {t('quizGenerator.formTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('quizGenerator.topic')} <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder={t('quizGenerator.topicPlaceholder')}
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('quizGenerator.questionCount')}</label>
                  <input
                    type="number"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    min={3}
                    max={20}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('quizGenerator.difficulty')}</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    {APP_CONFIG.DIFFICULTY_LEVELS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('quizGenerator.bloomFocus')}</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={targetBloomLevel}
                  onChange={(e) => setTargetBloomLevel(e.target.value)}
                >
                  {APP_CONFIG.BLOOM_LEVELS.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('quizGenerator.instructions')}</label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  rows={2}
                  placeholder={t('quizGenerator.instructionsPlaceholder')}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-11 gap-2 text-base font-medium">
                <Sparkles className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
                {loading ? t('quizGenerator.generating') : t('quizGenerator.generate')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Output Preview */}
        {result && quiz ? (
          <div className="sticky top-24 h-fit">
            <Card className="overflow-hidden border-orange-500/20 shadow-md shadow-orange-500/5">
              <CardHeader className="bg-orange-50/50 dark:bg-orange-500/5 border-b border-border pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl text-orange-700 dark:text-orange-400">
                      {quiz.title || topic}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      {t('quizGenerator.totalQuestions')}: {quiz.questions?.length || questionCount} • {t('quizGenerator.difficulty')}: {quiz.difficulty}
                    </p>
                  </div>
                  <ExportDropdown
                    workspaceId={activeWorkspace?.id}
                    generationId={result.id}
                    defaultFileName={`de-thi-${topic}`}
                  />
                </div>
              </CardHeader>

              <CardContent className="p-6 overflow-y-auto max-h-[calc(100vh-16rem)] space-y-6">
                {quiz.questions?.map((q, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <strong className="text-base font-medium leading-relaxed flex-1">
                        {t('quizGenerator.questionNum')} {q.question_number || i + 1}: {q.question_text || q.question}
                      </strong>
                      <div className="flex gap-2 flex-wrap justify-end">
                        {q.bloom_taxonomy_level && (
                          <BloomTaxonomyTag level={q.bloom_taxonomy_level} />
                        )}
                        <CitationBadge
                          count={q.source_chunk_ids?.length || 0}
                          onClick={() => setIsCitationOpen(true)}
                        />
                      </div>
                    </div>

                    {/* MCQ Options */}
                    {q.options && Array.isArray(q.options) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {q.options.map((opt, optIndex) => (
                          <div
                            key={optIndex}
                            className="p-3 bg-background border border-border rounded-lg text-sm"
                          >
                            {typeof opt === 'string' ? opt : `${opt.label}. ${opt.text}`}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Explanation / Answer Key */}
                    <div className="pt-4 border-t border-dashed border-border/60 text-sm space-y-2 mt-4">
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        {t('quizGenerator.correctAnswer')}: {q.correct_answer || q.correctAnswer}
                      </p>
                      {q.explanation && (
                        <p className="text-muted-foreground flex items-start gap-1.5 leading-relaxed">
                          <Lightbulb className="w-4 h-4 mt-0.5 text-yellow-500 shrink-0" />
                          <span>{t('quizGenerator.explanation')}: {q.explanation}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <CitationDrawer
              isOpen={isCitationOpen}
              onClose={() => setIsCitationOpen(false)}
              citations={[{ chunkId: '1', fileName: t('citation.sourceDoc'), excerpt: t('lessonPlanner.chunkExcerpt') }]}
            />
          </div>
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center p-8 text-center bg-muted/20 border-2 border-dashed border-border rounded-2xl h-[calc(100vh-16rem)] sticky top-24">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
              <FileQuestion className="w-8 h-8 text-orange-500 opacity-80" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('quizGenerator.emptyTitle', 'Chưa có đề thi nào được tạo')}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t('quizGenerator.emptyDesc', 'Hãy điền thông tin vào form bên trái và bấm "Sinh đề thi" để hệ thống AI bắt đầu tự động tạo câu hỏi dựa trên ngữ cảnh của không gian làm việc.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
