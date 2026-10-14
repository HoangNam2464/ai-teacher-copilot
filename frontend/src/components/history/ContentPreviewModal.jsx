import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  FileText,
  Target,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ExportDropdown } from '@/components/export/ExportDropdown';
import { BloomTaxonomyTag } from '@/components/ui/BloomTaxonomyTag';
import { RubricTableView } from '@/components/rubric';
import { formatDate } from '@/utils/formatters';

/**
 * ContentPreviewModal — Modal to inspect full generated content for a historical version.
 */
export function ContentPreviewModal({
  isOpen,
  onClose,
  item,
  workspaceId,
}) {
  const { t } = useTranslation();

  if (!isOpen || !item) return null;

  let contentData = item.contentData;
  if (typeof contentData === 'string') {
    try {
      contentData = JSON.parse(contentData);
    } catch {
      // ignore
    }
  }

  const isRubric = item.contentType === 'RUBRIC' || Boolean(contentData?.criteria);
  const isQuiz = item.contentType === 'QUIZ';
  const questions =
    contentData?.questions ||
    (Array.isArray(contentData) ? contentData : []);

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl max-h-[85vh] rounded-2xl bg-card border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${
                isQuiz
                  ? 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              }`}
            >
              {isQuiz ? <Target className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground truncate max-w-md">
                  {item.title || t('history.untitled', 'Chưa đặt tên')}
                </h3>
                <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-primary text-primary-foreground">
                  v{item.version || 1}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>{isQuiz ? t('history.quiz', 'Đề kiểm tra') : t('history.lessonPlan', 'Giáo án')}</span>
                <span>•</span>
                <span>{formatDate(item.createdAt)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ExportDropdown
              workspaceId={workspaceId}
              generationId={item.id}
              defaultFileName={`${isQuiz ? 'de-thi' : 'giao-an'}-${item.title || 'bai-soan'}-v${item.version || 1}`}
              planData={item.contentData || item.content}
              contentType={item.contentType}
              subject={item.subject || ''}
              gradeLevel={item.gradeLevel || ''}
            />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isRubric ? (
            <RubricTableView
              rubricData={contentData?.criteria ? contentData : undefined}
              readOnly={true}
            />
          ) : isQuiz ? (
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl">
                  {t('history.noQuestionsData', 'Không có dữ liệu câu hỏi chi tiết.')}
                </div>
              ) : (
                questions.map((q, idx) => {
                  const correctIdx = q.correct_answer_index;
                  const correctText =
                    q.correct_answer ||
                    q.correctAnswer ||
                    (correctIdx !== undefined && q.options?.[correctIdx]
                      ? `${optionLabels[correctIdx] || ''}. ${q.options[correctIdx]}`
                      : '');

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold leading-relaxed text-foreground">
                            {q.question_text || q.question}
                          </span>
                        </div>
                        {q.bloom_taxonomy_level && (
                          <BloomTaxonomyTag level={q.bloom_taxonomy_level} />
                        )}
                      </div>

                      {q.options && Array.isArray(q.options) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect =
                              optIdx === correctIdx ||
                              opt === q.correct_answer ||
                              opt === q.correctAnswer;
                            const text = typeof opt === 'string' ? opt : opt?.text || opt?.label;

                            return (
                              <div
                                key={optIdx}
                                className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200 font-medium'
                                    : 'bg-card border-border text-foreground'
                                }`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {optionLabels[optIdx]}
                                </span>
                                <span>{text}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {correctText && (
                        <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('quizGenerator.correctAnswer', 'Đáp án đúng')}: {correctText}</span>
                        </div>
                      )}

                      {q.explanation && (
                        <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/40 flex items-start gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{q.explanation}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Lesson Plan Preview */
            <div className="space-y-4 text-xs">
              {contentData?.objectives && (
                <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-1.5">
                  <h4 className="font-bold text-foreground uppercase text-[11px] tracking-wider text-emerald-600">
                    Mục tiêu bài dạy (Objectives)
                  </h4>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {typeof contentData.objectives === 'string'
                      ? contentData.objectives
                      : JSON.stringify(contentData.objectives, null, 2)}
                  </p>
                </div>
              )}

              {contentData?.activities && (
                <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-1.5">
                  <h4 className="font-bold text-foreground uppercase text-[11px] tracking-wider text-emerald-600">
                    Tiến trình dạy học (Activities)
                  </h4>
                  <pre className="text-[11px] font-mono text-muted-foreground bg-muted/40 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {typeof contentData.activities === 'string'
                      ? contentData.activities
                      : JSON.stringify(contentData.activities, null, 2)}
                  </pre>
                </div>
              )}

              {contentData?.assessment && (
                <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-1.5">
                  <h4 className="font-bold text-foreground uppercase text-[11px] tracking-wider text-emerald-600">
                    Kiểm tra đánh giá (Assessment)
                  </h4>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {typeof contentData.assessment === 'string'
                      ? contentData.assessment
                      : JSON.stringify(contentData.assessment, null, 2)}
                  </p>
                </div>
              )}

              {contentData?.rubric && (
                <div className="pt-2">
                  <RubricTableView
                    rubricData={contentData.rubric}
                    readOnly={true}
                  />
                </div>
              )}

              {!contentData?.objectives && !contentData?.activities && (
                <pre className="text-xs font-mono text-foreground bg-muted/30 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-96">
                  {JSON.stringify(contentData, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('common.close', 'Đóng')}
          </Button>
        </div>
      </div>
    </div>
  );
}
