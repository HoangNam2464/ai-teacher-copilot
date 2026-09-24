import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CitationBadge } from '@/components/citation/CitationBadge';
import { ExportDropdown } from '@/components/export/ExportDropdown';
import {
  Clock,
  BookOpen,
  GraduationCap,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Pencil,
  Eye,
  Plus,
  Trash2,
  Target,
  Package,
  Layers,
  FileCheck,
} from 'lucide-react';

/**
 * Inline Lesson Plan Editor with Auto-Save status, full field editing,
 * and preview / edit modes.
 */
export function InlineLessonEditor({
  plan,
  onChange,
  autoSaveState,
  workspaceName,
  workspaceId,
  generationId,
  subject,
  gradeLevel,
  durationMinutes,
  copied,
  onCopy,
  onOpenCitation,
  citationCount = 1,
}) {
  const { t } = useTranslation();
  const [isEditMode, setIsEditMode] = useState(false);

  if (!plan) return null;

  const objectivesList = Array.isArray(plan.objectives)
    ? plan.objectives
    : plan.objective
    ? [plan.objective]
    : [];

  const materialsList = Array.isArray(plan.materials_needed)
    ? plan.materials_needed
    : [];

  const sectionsList = Array.isArray(plan.sections) ? plan.sections : [];

  // Update a top-level field in the plan
  const updateField = (field, value) => {
    onChange({
      ...plan,
      [field]: value,
    });
  };

  // Objectives handlers
  const handleObjectiveChange = (index, value) => {
    const next = [...objectivesList];
    next[index] = value;
    updateField('objectives', next);
  };

  const handleAddObjective = () => {
    updateField('objectives', [...objectivesList, '']);
  };

  const handleRemoveObjective = (index) => {
    const next = objectivesList.filter((_, i) => i !== index);
    updateField('objectives', next);
  };

  // Materials handlers
  const handleMaterialChange = (index, value) => {
    const next = [...materialsList];
    next[index] = value;
    updateField('materials_needed', next);
  };

  const handleAddMaterial = () => {
    updateField('materials_needed', [...materialsList, '']);
  };

  const handleRemoveMaterial = (index) => {
    const next = materialsList.filter((_, i) => i !== index);
    updateField('materials_needed', next);
  };

  // Sections handlers
  const handleSectionChange = (index, field, value) => {
    const next = sectionsList.map((sec, i) => {
      if (i === index) {
        return { ...sec, [field]: value };
      }
      return sec;
    });
    updateField('sections', next);
  };

  const handleAddSection = () => {
    const next = [
      ...sectionsList,
      {
        title: `${t('lessonPlanner.activity', 'Hoạt động')} ${sectionsList.length + 1}`,
        duration_minutes: 10,
        content: '',
      },
    ];
    updateField('sections', next);
  };

  const handleRemoveSection = (index) => {
    const next = sectionsList.filter((_, i) => i !== index);
    updateField('sections', next);
  };

  // Format last saved time
  const formatSavedTime = (date) => {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <Card className="rounded-xl border border-emerald-500/30 shadow-sm overflow-hidden bg-card">
      {/* Card Header with Badges, Auto-Save Status & Action Toolbar */}
      <CardHeader className="bg-emerald-500/5 border-b border-border pb-4">
        <div className="flex flex-col gap-3">
          {/* Top Row: Title & Status Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex-1 min-w-[240px]">
              {isEditMode ? (
                <input
                  type="text"
                  value={plan.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder={t('lessonPlanner.titlePlaceholder', 'Nhập tiêu đề bài dạy...')}
                  className="w-full text-lg font-bold text-emerald-800 dark:text-emerald-400 bg-background border border-emerald-500/30 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              ) : (
                <CardTitle className="text-lg font-bold text-emerald-800 dark:text-emerald-400">
                  {plan.title || t('lessonPlanner.untitledPlan', 'Kế Hoạch Bài Dạy')}
                </CardTitle>
              )}
            </div>

            {/* Auto-Save Status Pill */}
            <div className="flex items-center gap-2">
              {autoSaveState?.status === 'saving' && (
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 animate-pulse"
                  title={t('lessonPlanner.savingStatus', 'Hệ thống đang tự động lưu các thay đổi')}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('lessonPlanner.saving', 'Đang lưu...')}</span>
                </div>
              )}

              {autoSaveState?.status === 'saved' && (
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                  title={t('lessonPlanner.savedTooltip', 'Toàn bộ nội dung đã được lưu an toàn')}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {autoSaveState.lastSavedTime
                      ? `${t('lessonPlanner.savedAt', 'Đã lưu')} ${formatSavedTime(autoSaveState.lastSavedTime)}`
                      : t('lessonPlanner.saved', 'Đã lưu')}
                  </span>
                </div>
              )}

              {autoSaveState?.status === 'error' && (
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                  title={t('lessonPlanner.errorTooltip', 'Không thể tự động lưu, nhấp để thử lại')}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{t('lessonPlanner.saveError', 'Lưu thất bại')}</span>
                  <button
                    type="button"
                    onClick={autoSaveState.saveNow}
                    className="underline font-semibold ml-1 hover:text-rose-900"
                  >
                    {t('common.retry', 'Thử lại')}
                  </button>
                </div>
              )}

              {autoSaveState?.status === 'unsaved' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>{t('lessonPlanner.unsaved', 'Chưa lưu')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Second Row: Metadata & Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {isEditMode ? (
                <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-md border border-border">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={plan.duration_minutes || durationMinutes || 45}
                    onChange={(e) => updateField('duration_minutes', Number(e.target.value))}
                    className="w-12 bg-transparent text-xs text-foreground focus:outline-none font-semibold text-center"
                  />
                  <span>{t('lessonPlanner.durationUnit', 'phút')}</span>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 font-medium bg-background px-2 py-0.5 rounded-md border border-border">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  {plan.duration_minutes || durationMinutes || 45} {t('lessonPlanner.durationUnit', 'phút')}
                </span>
              )}

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

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Manual Save Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={autoSaveState?.saveNow}
                disabled={autoSaveState?.isSaving}
                className="flex items-center gap-1.5 text-xs font-medium border-border hover:bg-muted"
                title={t('lessonPlanner.saveNowTooltip', 'Lưu ngay các thay đổi hiện tại')}
              >
                <Save className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('lessonPlanner.save', 'Lưu')}</span>
              </Button>

              {/* Mode Toggle: Edit Mode vs Preview Mode */}
              <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    !isEditMode
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title={t('lessonPlanner.previewTooltip', 'Chế độ xem giáo án hoàn thiện')}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t('lessonPlanner.previewMode', 'Xem trước')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    isEditMode
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title={t('lessonPlanner.editTooltip', 'Chế độ chỉnh sửa nội dung')}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{t('lessonPlanner.editMode', 'Chỉnh sửa')}</span>
                </button>
              </div>

              {/* Citation Badge */}
              <CitationBadge
                count={citationCount}
                onClick={onOpenCitation}
              />

              {/* Copy to Clipboard Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onCopy}
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

              {/* Export Dropdown / Modal */}
              <ExportDropdown
                workspaceId={workspaceId}
                generationId={generationId || 'latest'}
                defaultFileName={`giao-an-${(plan.title || 'bai-day').toLowerCase().replace(/\s+/g, '-')}`}
                planData={plan}
                subject={subject}
                gradeLevel={gradeLevel}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Card Content with Structured Plan Body */}
      <CardContent className="p-5 overflow-y-auto max-h-[calc(100vh-14rem)] space-y-6">
        {/* 1. Learning Objectives */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Target className="w-4 h-4 text-emerald-600" />
              <span>{t('lessonPlanner.objectivesTitle', 'Mục tiêu bài dạy')}</span>
            </h4>
            {isEditMode && (
              <button
                type="button"
                onClick={handleAddObjective}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('lessonPlanner.addObjective', 'Thêm mục tiêu')}</span>
              </button>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
            {isEditMode ? (
              <div className="space-y-2">
                {objectivesList.map((obj, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono w-4 text-right">
                      {i + 1}.
                    </span>
                    <input
                      type="text"
                      value={obj}
                      onChange={(e) => handleObjectiveChange(i, e.target.value)}
                      placeholder={t('lessonPlanner.objectivePlaceholder', 'Mục tiêu kiến thức, kỹ năng...')}
                      className="flex-1 text-xs sm:text-sm bg-background border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveObjective(i)}
                      className="text-muted-foreground hover:text-rose-500 p-1 rounded-md transition-colors"
                      title={t('common.delete', 'Xoá')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {objectivesList.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-2">
                    {t('lessonPlanner.noObjectives', 'Chưa có mục tiêu. Nhấn "Thêm mục tiêu" để bắt đầu.')}
                  </p>
                )}
              </div>
            ) : (
              <ul className="space-y-1.5 pl-5 list-disc text-xs sm:text-sm text-foreground/90">
                {objectivesList.map((obj, i) => (
                  <li key={i} className="leading-relaxed">
                    {obj}
                  </li>
                ))}
                {objectivesList.length === 0 && (
                  <li className="italic text-muted-foreground list-none pl-0">
                    {t('lessonPlanner.emptyObjectives', 'Chưa thiết lập mục tiêu bài dạy')}
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* 2. Teaching Materials Needed */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>{t('lessonPlanner.materialsTitle', 'Thiết bị & Học liệu dạy học')}</span>
            </h4>
            {isEditMode && (
              <button
                type="button"
                onClick={handleAddMaterial}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('lessonPlanner.addMaterial', 'Thêm học liệu')}</span>
              </button>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
            {isEditMode ? (
              <div className="space-y-2">
                {materialsList.map((mat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono w-4 text-right">
                      •
                    </span>
                    <input
                      type="text"
                      value={mat}
                      onChange={(e) => handleMaterialChange(i, e.target.value)}
                      placeholder={t('lessonPlanner.materialPlaceholder', 'Ví dụ: Máy chiếu, phiếu học tập số 1...')}
                      className="flex-1 text-xs sm:text-sm bg-background border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterial(i)}
                      className="text-muted-foreground hover:text-rose-500 p-1 rounded-md transition-colors"
                      title={t('common.delete', 'Xoá')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {materialsList.length === 0 && (
                  <p className="text-xs text-muted-foreground italic text-center py-2">
                    {t('lessonPlanner.noMaterials', 'Chưa có thiết bị, học liệu. Nhấn "Thêm học liệu" để bổ sung.')}
                  </p>
                )}
              </div>
            ) : (
              <ul className="space-y-1.5 pl-5 list-disc text-xs sm:text-sm text-foreground/90">
                {materialsList.map((mat, i) => (
                  <li key={i} className="leading-relaxed">
                    {mat}
                  </li>
                ))}
                {materialsList.length === 0 && (
                  <li className="italic text-muted-foreground list-none pl-0">
                    {t('lessonPlanner.emptyMaterials', 'Chưa thiết lập thiết bị & học liệu')}
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* 3. Activity Sequence (Sections) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>{t('lessonPlanner.activitiesTitle', 'Tiến trình hoạt động')}</span>
            </h4>
            {isEditMode && (
              <button
                type="button"
                onClick={handleAddSection}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('lessonPlanner.addSection', 'Thêm hoạt động')}</span>
              </button>
            )}
          </div>

          <div className="space-y-3.5">
            {sectionsList.map((sec, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-muted/30 border border-border hover:border-emerald-500/30 transition-colors"
              >
                {isEditMode ? (
                  <div className="space-y-3">
                    {/* Activity Header Row in Edit Mode */}
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 text-xs flex items-center justify-center font-bold shrink-0">
                        {i + 1}
                      </span>
                      <input
                        type="text"
                        value={sec.title || ''}
                        onChange={(e) => handleSectionChange(i, 'title', e.target.value)}
                        placeholder={t('lessonPlanner.sectionTitlePlaceholder', 'Tên hoạt động...')}
                        className="flex-1 text-sm font-semibold bg-background border border-border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <div className="flex items-center gap-1 bg-background border border-border rounded-md px-2 py-1 text-xs shrink-0">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={sec.duration_minutes || ''}
                          onChange={(e) =>
                            handleSectionChange(i, 'duration_minutes', Number(e.target.value))
                          }
                          className="w-10 bg-transparent text-xs font-semibold text-center focus:outline-none"
                        />
                        <span className="text-muted-foreground">{t('lessonPlanner.durationUnit', 'phút')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(i)}
                        className="text-muted-foreground hover:text-rose-500 p-1.5 rounded-md transition-colors shrink-0"
                        title={t('lessonPlanner.deleteSection', 'Xoá hoạt động này')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Activity Content Textarea in Edit Mode */}
                    <div>
                      <textarea
                        rows={4}
                        value={sec.content || ''}
                        onChange={(e) => handleSectionChange(i, 'content', e.target.value)}
                        placeholder={t(
                          'lessonPlanner.sectionContentPlaceholder',
                          'Mục tiêu, nhiệm vụ của giáo viên và học sinh, sản phẩm dự kiến...'
                        )}
                        className="w-full text-xs sm:text-sm bg-background border border-border rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed font-sans"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
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
                )}
              </div>
            ))}

            {sectionsList.length === 0 && (
              <div className="p-6 text-center border border-dashed border-border rounded-xl">
                <p className="text-xs text-muted-foreground italic mb-2">
                  {t('lessonPlanner.noSections', 'Chưa có hoạt động dạy học nào trong kế hoạch.')}
                </p>
                {isEditMode && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddSection}
                    className="text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>{t('lessonPlanner.addSection', 'Thêm hoạt động đầu tiên')}</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Grounding Note */}
        <div className="pt-2 text-center border-t border-border">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {t(
                'lessonPlanner.groundingNotice',
                'Nội dung bài dạy được đối chiếu từ tài liệu học tập trong không gian làm việc'
              )}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
