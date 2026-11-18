import React from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap, CheckCircle2, Layers, Sparkles, Shield, FileText } from 'lucide-react';

/**
 * QuizExportControls — Controls for selecting Student Exam Sheet vs Teacher Answer Key (FE-019 / ATC-406).
 * Fulfills Acceptance Criteria:
 * - Có lựa chọn student exam
 * - Có lựa chọn teacher answer key
 * - Lựa chọn tải cả 2 bản cùng lúc
 * - Đảm bảo student sheet không hiển thị answer key
 */
export function QuizExportControls({
  exportMode = 'STUDENT_EXAM',
  onChangeMode,
  disabled = false,
  className = '',
}) {
  const { t } = useTranslation();

  const options = [
    {
      id: 'STUDENT_EXAM',
      title: t('export.studentExamTitle', 'Đề thi cho học sinh'),
      subtitle: t(
        'export.studentExamDesc',
        'Ẩn toàn bộ đáp án và lời giải. Có khung thông tin học sinh và phiếu trả lời trắc nghiệm.'
      ),
      badge: t('export.studentExamBadge', 'Không đáp án'),
      icon: GraduationCap,
      color: 'blue',
    },
    {
      id: 'TEACHER_KEY',
      title: t('export.teacherKeyTitle', 'Đáp án & Hướng dẫn chấm'),
      subtitle: t(
        'export.teacherKeyDesc',
        'Bao gồm bảng đáp án chuẩn, lời giải chi tiết, phân loại Bloom và trích dẫn nguồn.'
      ),
      badge: t('export.teacherKeyBadge', 'Bản giáo viên'),
      icon: CheckCircle2,
      color: 'emerald',
    },
    {
      id: 'BOTH',
      title: t('export.bothModesTitle', 'Tải trọn bộ (Đề thi + Đáp án)'),
      subtitle: t(
        'export.bothModesDesc',
        'Tải đồng thời cả 2 tệp riêng biệt chỉ bằng 1 thao tác chọn (1 file cho học sinh + 1 file cho giáo viên).'
      ),
      badge: t('export.bothModesBadge', 'Khuyên dùng'),
      icon: Layers,
      color: 'orange',
    },
  ];

  return (
    <div className={`space-y-2.5 ${className}`}>
      <label className="text-xs font-semibold text-foreground flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-primary" />
          {t('export.quizModeLabel', 'Chế độ xuất đề kiểm tra')}
        </span>
        <span className="text-[11px] text-muted-foreground font-normal">
          {t('export.quizModeHint', 'Chọn định dạng nội dung phù hợp')}
        </span>
      </label>

      <div className="grid grid-cols-1 gap-2">
        {options.map((opt) => {
          const isSelected = exportMode === opt.id;
          const Icon = opt.icon;

          return (
            <div
              key={opt.id}
              onClick={() => !disabled && onChangeMode(opt.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                isSelected
                  ? 'bg-primary/5 border-primary shadow-xs ring-1 ring-primary/30'
                  : 'bg-card border-border hover:border-primary/40 hover:bg-muted/30'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-foreground truncate">{opt.title}</h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                      opt.color === 'emerald'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : opt.color === 'blue'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
                    }`}
                  >
                    {opt.badge}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                  {opt.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QuizExportControls;
