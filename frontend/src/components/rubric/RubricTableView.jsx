import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Table,
  Plus,
  Trash2,
  Edit2,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  Award,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Info,
  Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Default K-12 Competency-Based Assessment Rubric Template
export const DEFAULT_RUBRIC_DATA = {
  title: 'Ma trận Rubric đánh giá năng lực học sinh',
  description: 'Thang đo đánh giá kết quả học tập và năng lực vận dụng kiến thức theo chuẩn giáo dục K-12.',
  scaleType: 'PERCENTAGE', // 'PERCENTAGE' or 'POINTS'
  levels: [
    { id: 'L4', name: 'Xuất sắc', points: 4, label: 'Mức 4 (Giỏi)', color: 'emerald' },
    { id: 'L3', name: 'Tốt / Khá', points: 3, label: 'Mức 3 (Khá)', color: 'blue' },
    { id: 'L2', name: 'Đạt / TB', points: 2, label: 'Mức 2 (Đạt)', color: 'amber' },
    { id: 'L1', name: 'Cần cố gắng', points: 1, label: 'Mức 1 (Chưa đạt)', color: 'rose' },
  ],
  criteria: [
    {
      id: 'crit-1',
      name: 'Nắm vững kiến thức cốt lõi',
      description: 'Nhận diện khái niệm, định lý và công thức trọng tâm của bài học.',
      weight: 30,
      descriptors: {
        L4: 'Giải thích bản chất khái niệm chính xác, hệ thống hoá toàn diện và liên hệ mở rộng đúng.',
        L3: 'Hiểu rõ các định lý và công thức chính, áp dụng độc lập không cần hỗ trợ.',
        L2: 'Nhớ được công thức cơ bản nhưng cần bảng tra hoặc gợi ý khi giải thích.',
        L1: 'Nhầm lẫn các khái niệm cốt lõi, không nhớ hoặc áp dụng sai công thức.',
      },
    },
    {
      id: 'crit-2',
      name: 'Kỹ năng giải quyết bài toán',
      description: 'Phân tích yêu cầu, lựa chọn chiến lược và thực hiện các bước giải quyết vấn đề.',
      weight: 40,
      descriptors: {
        L4: 'Lựa chọn phương pháp giải tối ưu, lập luận chặt chẽ, xử lý linh hoạt các tình huống biến đổi.',
        L3: 'Thực hiện đầy đủ quy trình giải, biến đổi logic và cho kết quả chính xác.',
        L2: 'Thực hiện được các bài toán mẫu, còn lúng túng khi gặp bài toán có ngữ cảnh mới.',
        L1: 'Chưa biết lập kế hoạch giải hoặc bỏ cuộc khi bài toán có độ phức tạp trung bình.',
      },
    },
    {
      id: 'crit-3',
      name: 'Trình bày và liên hệ thực tế',
      description: 'Diễn đạt bài làm khoa học, lập luận rõ ràng và rút ra ý nghĩa thực tiễn.',
      weight: 30,
      descriptors: {
        L4: 'Trình bày chuẩn mực, ngôn ngữ khoa học gãy gọn, minh họa trực quan và liên hệ sâu sắc.',
        L3: 'Trình bày rõ ràng, dễ hiểu, các bước liên kết hợp lý và kết luận đúng yêu cầu.',
        L2: 'Trình bày còn tắt hoặc lộn xộn, kết luận chưa hoàn chỉnh hoặc thiếu đơn vị đo.',
        L1: 'Trình bày cẩu thả, tẩy xoá nhiều hoặc không có lời kết luận cụ thể.',
      },
    },
  ],
};

/**
 * RubricTableView — Assessment Rubric Table & Inline Criteria Editor (FE-018 / ATC-405).
 * Enables teachers to view, edit, rebalance weights, and save criteria scoring matrices.
 */
export function RubricTableView({
  rubricData = DEFAULT_RUBRIC_DATA,
  onSave,
  readOnly = false,
  className = '',
}) {
  const { t } = useTranslation();

  // Local editable state
  const [rubric, setRubric] = useState(() => {
    return rubricData && rubricData.criteria ? rubricData : DEFAULT_RUBRIC_DATA;
  });

  const [isEditMode, setIsEditMode] = useState(!readOnly);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Sync when rubricData prop changes
  useEffect(() => {
    if (rubricData && rubricData.criteria) {
      setRubric(rubricData);
    }
  }, [rubricData]);

  // Total weight validation
  const totalWeight = useMemo(() => {
    const list = rubric?.criteria || [];
    return list.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  }, [rubric?.criteria]);

  const isWeightValid = totalWeight === 100;

  // Criteria update handlers
  const handleUpdateCriterion = (index, field, value) => {
    setRubric((prev) => {
      const updatedCriteria = [...prev.criteria];
      updatedCriteria[index] = {
        ...updatedCriteria[index],
        [field]: value,
      };
      return { ...prev, criteria: updatedCriteria };
    });
    setIsSaved(false);
  };

  const handleUpdateDescriptor = (criterionIndex, levelId, value) => {
    setRubric((prev) => {
      const updatedCriteria = [...prev.criteria];
      const targetCrit = { ...updatedCriteria[criterionIndex] };
      targetCrit.descriptors = {
        ...targetCrit.descriptors,
        [levelId]: value,
      };
      updatedCriteria[criterionIndex] = targetCrit;
      return { ...prev, criteria: updatedCriteria };
    });
    setIsSaved(false);
  };

  const handleAddCriterion = () => {
    const newId = `crit-${Date.now()}`;
    const newCriterion = {
      id: newId,
      name: 'Tiêu chí đánh giá mới',
      description: 'Mô tả yêu cầu cần đạt của tiêu chí này...',
      weight: 10,
      descriptors: {
        L4: 'Thể hiện xuất sắc tiêu chí, vượt chuẩn yêu cầu...',
        L3: 'Đáp ứng tốt tiêu chí một cách độc lập...',
        L2: 'Đáp ứng ở mức cơ bản, cần thêm hướng dẫn...',
        L1: 'Chưa đạt yêu cầu cơ bản của tiêu chí...',
      },
    };

    setRubric((prev) => ({
      ...prev,
      criteria: [...prev.criteria, newCriterion],
    }));
    setIsSaved(false);
  };

  const handleRemoveCriterion = (index) => {
    if (rubric.criteria.length <= 1) {
      toast.warning('Bảng Rubric cần ít nhất 1 tiêu chí đánh giá.');
      return;
    }
    setRubric((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index),
    }));
    setIsSaved(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (onSave) {
        await onSave(rubric);
      }
      setIsSaved(true);
      toast.success(t('rubric.saveSuccess', 'Đã lưu ma trận Rubric đánh giá thành công!'));
    } catch (err) {
      console.error('Failed to save rubric:', err);
      toast.error('Lưu ma trận Rubric thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setRubric(DEFAULT_RUBRIC_DATA);
    setIsSaved(false);
    toast.info('Đã hoàn tác về Rubric mẫu ban đầu.');
  };

  const levels = rubric.levels || DEFAULT_RUBRIC_DATA.levels;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            {isEditMode && !readOnly ? (
              <input
                type="text"
                value={rubric.title}
                onChange={(e) => setRubric((prev) => ({ ...prev, title: e.target.value }))}
                className="text-base font-bold text-foreground bg-transparent border-b border-dashed border-border focus:border-primary focus:outline-none px-1"
                placeholder="Tiêu đề bảng Rubric..."
              />
            ) : (
              <h3 className="text-base font-bold text-foreground">{rubric.title}</h3>
            )}
          </div>
          <p className="text-xs text-muted-foreground pl-10">
            {rubric.description}
          </p>
        </div>

        {/* Action Controls & Weight Validation Badge */}
        <div className="flex items-center gap-2 flex-wrap sm:self-center pl-10 sm:pl-0">
          {/* Total Weight Status Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isWeightValid
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
            }`}
            title="Tổng trọng số các tiêu chí nên bằng 100%"
          >
            {isWeightValid ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            )}
            <span>
              {t('rubric.totalWeight', 'Tổng trọng số')}: <strong>{totalWeight}%</strong>
            </span>
          </div>

          {!readOnly && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode((prev) => !prev)}
                className="h-8 gap-1.5 text-xs border-border"
              >
                <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{isEditMode ? t('common.preview', 'Xem trước') : t('common.edit', 'Chỉnh sửa')}</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                {isSaving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isSaved ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{isSaved ? t('common.saved', 'Đã lưu') : t('common.save', 'Lưu Rubric')}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Rubric Matrix Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            {/* Table Header: Score Levels */}
            <thead>
              <tr className="bg-muted/60 border-b border-border">
                {/* Criteria Column Header */}
                <th className="p-4 w-[28%] min-w-[220px] font-bold text-foreground text-xs uppercase tracking-wider">
                  <div className="flex items-center justify-between">
                    <span>{t('rubric.criteriaCol', 'Tiêu chí đánh giá')}</span>
                    <span className="text-[11px] font-normal text-muted-foreground lowercase">
                      ({rubric.criteria.length} tiêu chí)
                    </span>
                  </div>
                </th>

                {/* Score Level Headers */}
                {levels.map((lvl) => {
                  const isEmerald = lvl.color === 'emerald';
                  const isBlue = lvl.color === 'blue';
                  const isAmber = lvl.color === 'amber';

                  return (
                    <th
                      key={lvl.id}
                      className={`p-3.5 w-[18%] min-w-[170px] border-l border-border/80 text-left ${
                        isEmerald
                          ? 'bg-emerald-500/5'
                          : isBlue
                          ? 'bg-blue-500/5'
                          : isAmber
                          ? 'bg-amber-500/5'
                          : 'bg-rose-500/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isEmerald
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : isBlue
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : isAmber
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {lvl.points} {t('rubric.points', 'điểm')}
                        </span>
                        <Award
                          className={`w-3.5 h-3.5 ${
                            isEmerald
                              ? 'text-emerald-600'
                              : isBlue
                              ? 'text-blue-600'
                              : isAmber
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        />
                      </div>
                      <div className="font-bold text-foreground text-xs">{lvl.name}</div>
                      <div className="text-[10px] text-muted-foreground">{lvl.label}</div>
                    </th>
                  );
                })}

                {/* Actions column if editing */}
                {isEditMode && !readOnly && (
                  <th className="p-3 w-12 text-center border-l border-border/80">
                    <span className="sr-only">Hành động</span>
                  </th>
                )}
              </tr>
            </thead>

            {/* Table Body: Criteria Rows */}
            <tbody className="divide-y divide-border">
              {rubric.criteria.map((crit, cIdx) => (
                <tr key={crit.id || cIdx} className="hover:bg-muted/20 transition-colors">
                  {/* Criteria Column */}
                  <td className="p-4 align-top space-y-2 bg-card">
                    {isEditMode && !readOnly ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                            {cIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={crit.name}
                            onChange={(e) => handleUpdateCriterion(cIdx, 'name', e.target.value)}
                            className="flex-1 text-xs font-bold text-foreground bg-background border border-border rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none"
                            placeholder="Tên tiêu chí..."
                          />
                        </div>

                        <textarea
                          rows={2}
                          value={crit.description || ''}
                          onChange={(e) =>
                            handleUpdateCriterion(cIdx, 'description', e.target.value)
                          }
                          className="w-full text-[11px] text-muted-foreground bg-background border border-border rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none resize-none leading-relaxed"
                          placeholder="Mô tả tiêu chí..."
                        />

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="text-[11px] font-medium">{t('rubric.weight', 'Trọng số')}:</span>
                          <div className="inline-flex items-center gap-1 bg-background border border-border rounded-lg px-2 py-1">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={crit.weight}
                              onChange={(e) =>
                                handleUpdateCriterion(cIdx, 'weight', Number(e.target.value))
                              }
                              className="w-12 text-xs font-bold text-foreground text-center focus:outline-none"
                            />
                            <span className="text-xs font-bold text-muted-foreground">%</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                              {cIdx + 1}
                            </span>
                            <strong className="text-xs font-bold text-foreground">
                              {crit.name}
                            </strong>
                          </div>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-muted text-foreground border border-border/80 shrink-0">
                            {crit.weight}%
                          </span>
                        </div>
                        {crit.description && (
                          <p className="text-[11px] text-muted-foreground pl-7 leading-relaxed">
                            {crit.description}
                          </p>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Level Descriptors Columns */}
                  {levels.map((lvl) => {
                    const descText = crit.descriptors?.[lvl.id] || '';
                    return (
                      <td
                        key={lvl.id}
                        className="p-3.5 align-top border-l border-border/70 text-xs leading-relaxed"
                      >
                        {isEditMode && !readOnly ? (
                          <textarea
                            rows={4}
                            value={descText}
                            onChange={(e) =>
                              handleUpdateDescriptor(cIdx, lvl.id, e.target.value)
                            }
                            className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none resize-none leading-relaxed"
                            placeholder={`Mô tả tiêu chuẩn ${lvl.name}...`}
                          />
                        ) : (
                          <p className="text-muted-foreground leading-relaxed">
                            {descText || (
                              <span className="italic text-muted-foreground/60 text-[11px]">
                                (Chưa có mô tả)
                              </span>
                            )}
                          </p>
                        )}
                      </td>
                    );
                  })}

                  {/* Delete Criterion Action */}
                  {isEditMode && !readOnly && (
                    <td className="p-3 text-center align-middle border-l border-border/70">
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(cIdx)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title={t('rubric.deleteCriterion', 'Xóa tiêu chí này')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Add Criterion & Reset Buttons */}
        {isEditMode && !readOnly && (
          <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCriterion}
              className="gap-1.5 text-xs border-dashed border-primary/40 text-primary hover:bg-primary/5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('rubric.addCriterion', 'Thêm tiêu chí đánh giá')}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetToDefault}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('rubric.resetDefault', 'Khôi phục mẫu chuẩn')}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Pedagogical Guidance Tip */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>{t('rubric.pedagogicalTip', 'Lưu ý sư phạm')}:</strong>{' '}
          {t(
            'rubric.tipContent',
            'Bảng Rubric định lượng hóa các mức độ thành thạo của học sinh giúp việc đánh giá công bằng, khách quan và minh bạch. Thầy/Cô có thể nhấp trực tiếp vào từng ô để điều chỉnh mức điểm và mô tả phù hợp với môn học.'
          )}
        </p>
      </div>
    </div>
  );
}
