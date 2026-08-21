import React, { useState } from 'react';
import { Card } from '../../../core/components/ui/Card';
import { Button } from '../../../core/components/ui/Button';
import { Badge } from '../../../core/components/ui/Badge';
import { DraftDisclaimerBanner } from '../../../core/components/feedback/DraftDisclaimerBanner';
import { CitationBadge } from '../../../core/components/citation/CitationBadge';
import { ExportDropdown } from '../../../core/components/export/ExportDropdown';
import { ActivityTimelineItem } from './ActivityTimelineItem';
import {
  IconTarget,
  IconBookOpen,
  IconClock,
  IconEdit,
  IconCopy,
  IconCheck,
  IconRefresh,
  IconPlus,
  IconClose,
} from '../../../core/components/icons/SvgIcons';

export function LessonPlanCanvas({
  plan,
  workspace,
  localVersion = 1,
  sessionReviewStatus = 'DRAFT',
  onUpdatePlan,
  onApprove,
  onOpenRegenerate,
  onOpenCitations,
  isRegenerating = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(plan);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [newMaterialText, setNewMaterialText] = useState('');

  const activePlan = isEditing ? editDraft : plan;
  const isApproved = sessionReviewStatus === 'APPROVED_SESSION';

  const handleStartEdit = () => {
    setEditDraft(JSON.parse(JSON.stringify(plan)));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onUpdatePlan(editDraft);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditDraft(plan);
    setIsEditing(false);
  };

  const handleAddMaterial = (e) => {
    e.preventDefault();
    if (!newMaterialText.trim()) return;
    const currentMaterials = editDraft.materials_needed || [];
    setEditDraft({
      ...editDraft,
      materials_needed: [...currentMaterials, newMaterialText.trim()],
    });
    setNewMaterialText('');
  };

  const handleRemoveMaterial = (indexToRemove) => {
    const currentMaterials = editDraft.materials_needed || [];
    setEditDraft({
      ...editDraft,
      materials_needed: currentMaterials.filter((_, i) => i !== indexToRemove),
    });
  };

  const handleAddActivity = () => {
    const currentSections = editDraft.sections || [];
    const newActivity = {
      title: `Hoạt động ${currentSections.length + 1}`,
      duration_minutes: 10,
      content: '',
    };
    setEditDraft({
      ...editDraft,
      sections: [...currentSections, newActivity],
    });
  };

  const handleUpdateActivity = (index, updatedItem) => {
    const currentSections = [...(editDraft.sections || [])];
    currentSections[index] = updatedItem;
    setEditDraft({
      ...editDraft,
      sections: currentSections,
    });
  };

  const handleDeleteActivity = (indexToDelete) => {
    const currentSections = editDraft.sections || [];
    setEditDraft({
      ...editDraft,
      sections: currentSections.filter((_, i) => i !== indexToDelete),
    });
  };

  const handleCopyMarkdown = async () => {
    const markdownLines = [];
    markdownLines.push(`# ${activePlan.title || 'Kế hoạch bài dạy'}\n`);
    markdownLines.push(`**Môn học:** ${workspace?.subject || 'Chung'} | **Khối lớp:** ${workspace?.gradeLevel || 'K12'}`);
    markdownLines.push(`**Phiên bản:** v${localVersion} (Bản thảo trong phiên làm việc)\n`);
    markdownLines.push(`## 1. Mục tiêu bài dạy`);
    markdownLines.push(`${activePlan.objective || 'Chưa có mục tiêu cụ thể.'}\n`);

    if (activePlan.materials_needed && activePlan.materials_needed.length > 0) {
      markdownLines.push(`## 2. Thiết bị & Học liệu cần chuẩn bị`);
      activePlan.materials_needed.forEach((m) => markdownLines.push(`- ${m}`));
      markdownLines.push('');
    }

    markdownLines.push(`## 3. Tiến trình hoạt động giảng dạy`);
    if (activePlan.sections && activePlan.sections.length > 0) {
      activePlan.sections.forEach((sec, idx) => {
        markdownLines.push(`### ${sec.title || `Hoạt động ${idx + 1}`} (${sec.duration_minutes || 10} phút)`);
        markdownLines.push(`${sec.content || ''}\n`);
      });
    }

    try {
      await navigator.clipboard.writeText(markdownLines.join('\n'));
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2200);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const totalDuration = (activePlan.sections || []).reduce(
    (sum, sec) => sum + (Number(sec.duration_minutes) || 0),
    0
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* 1. Session Draft Disclaimer Banner */}
      <DraftDisclaimerBanner
        status={isApproved ? 'APPROVED' : 'DRAFT'}
        version={localVersion}
      />

      {/* 2. Main Canvas Card */}
      <Card>
        {/* Document Header & Action Toolbar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            paddingBottom: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: 'var(--space-5)',
          }}
        >
          <div style={{ flex: 1, minWidth: '240px' }}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
                  Tên bài dạy:
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}
                  value={editDraft.title}
                  onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                />
              </div>
            ) : (
              <>
                <h3
                  style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 'var(--line-height-normal)',
                  }}
                >
                  {activePlan.title || 'Kế hoạch bài dạy'}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-1)', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <IconClock size={13} />
                    <span>Tổng thời lượng: <strong>{totalDuration || 45} phút</strong></span>
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>•</span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    {workspace?.subject || 'Chung'} ({workspace?.gradeLevel || 'K12'})
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {/* Citation Badge */}
            {activePlan.source_chunk_ids && activePlan.source_chunk_ids.length > 0 ? (
              <CitationBadge
                count={activePlan.source_chunk_ids.length}
                onClick={onOpenCitations}
              />
            ) : (
              <button
                type="button"
                className="citation-badge"
                onClick={onOpenCitations}
                title="Xem trạng thái căn cứ học liệu RAG"
              >
                <IconBookOpen size={12} />
                <span>Căn cứ học liệu</span>
              </button>
            )}

            {/* Copy Markdown Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMarkdown}
              icon={copyFeedback ? <IconCheck size={14} /> : <IconCopy size={14} />}
              title="Sao chép toàn bộ giáo án dạng Markdown"
            >
              <span>{copyFeedback ? 'Đã sao chép!' : 'Sao chép'}</span>
            </Button>

            {/* Edit / Save Toggle */}
            {isEditing ? (
              <div style={{ display: 'flex', gap: 'var(--space-1-5)' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveEdit}
                  icon={<IconCheck size={14} />}
                >
                  Lưu
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleStartEdit}
                icon={<IconEdit size={14} />}
                title="Chỉnh sửa nội dung giáo án"
              >
                <span>Chỉnh sửa</span>
              </Button>
            )}

            {/* Export Dropdown */}
            <ExportDropdown
              workspaceId={workspace?.id}
              defaultFileName={`giao-an-${activePlan.title || 'bai-day'}`}
            />
          </div>
        </div>

        {/* 3. Objectives Section */}
        <section style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
              <IconTarget size={18} />
            </span>
            <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
              Mục Tiêu Bài Dạy (Learning Objectives)
            </h4>
          </div>

          {isEditing ? (
            <textarea
              className="form-textarea"
              rows={3}
              style={{ fontSize: 'var(--font-size-xs)' }}
              placeholder="Nhập mục tiêu bài dạy cần đạt..."
              value={editDraft.objective}
              onChange={(e) => setEditDraft({ ...editDraft, objective: e.target.value })}
            />
          ) : (
            <div
              style={{
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-subtle)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-relaxed)',
                whiteSpace: 'pre-line',
              }}
            >
              {activePlan.objective || 'Chưa có thông tin mục tiêu bài dạy.'}
            </div>
          )}
        </section>

        {/* 4. Materials Needed Section */}
        {(isEditing || (activePlan.materials_needed && activePlan.materials_needed.length > 0)) && (
          <section style={{ marginBottom: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
                <IconBookOpen size={18} />
              </span>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                Thiết Bị & Học Liệu Cần Chuẩn Bị
              </h4>
            </div>

            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {(editDraft.materials_needed || []).map((mat, i) => (
                    <span
                      key={i}
                      className="badge badge-neutral"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px' }}
                    >
                      <span>{mat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(i)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', color: 'var(--color-text-muted)' }}
                        aria-label={`Xóa ${mat}`}
                      >
                        <IconClose size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <form onSubmit={handleAddMaterial} style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '4px' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1-5) var(--space-3)' }}
                    placeholder="Thêm học liệu (nhấn Enter)..."
                    value={newMaterialText}
                    onChange={(e) => setNewMaterialText(e.target.value)}
                  />
                  <Button type="submit" variant="secondary" size="sm" icon={<IconPlus size={14} />}>
                    Thêm
                  </Button>
                </form>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {activePlan.materials_needed.map((mat, i) => (
                  <Badge key={i} variant="neutral" style={{ fontSize: 'var(--font-size-xs)' }}>
                    {mat}
                  </Badge>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 5. Activities Timeline Sequence */}
        <section style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
                <IconClock size={18} />
              </span>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                Tiến Trình Hoạt Động Giảng Dạy
              </h4>
            </div>

            {isEditing && (
              <Button
                variant="outline"
                size="xs"
                onClick={handleAddActivity}
                icon={<IconPlus size={13} />}
              >
                Thêm hoạt động
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {(!activePlan.sections || activePlan.sections.length === 0) ? (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: 'var(--space-4)', textAlign: 'center', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                Chưa có danh sách hoạt động giảng dạy.
              </p>
            ) : (
              activePlan.sections.map((sec, idx) => (
                <ActivityTimelineItem
                  key={idx}
                  index={idx}
                  activity={sec}
                  isEditing={isEditing}
                  onChange={(updated) => handleUpdateActivity(idx, updated)}
                  onDelete={isEditing ? () => handleDeleteActivity(idx) : null}
                />
              ))
            )}
          </div>
        </section>

        {/* 6. Session Action Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--color-border)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
            {isApproved ? (
              <span style={{ color: 'var(--color-success)', fontWeight: 'var(--font-weight-semibold)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <IconCheck size={14} />
                <span>Đã duyệt trong phiên làm việc</span>
              </span>
            ) : (
              <span>Bản nháp v{localVersion} • Có thể biên tập hoặc sinh lại</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {/* Local Regenerate Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenRegenerate}
              disabled={isRegenerating}
              loading={isRegenerating}
              icon={<IconRefresh size={14} />}
            >
              <span>Sinh lại với AI</span>
            </Button>

            {/* Local Approve Button */}
            {!isApproved && (
              <Button
                variant="primary"
                size="sm"
                onClick={onApprove}
                icon={<IconCheck size={14} />}
              >
                <span>Duyệt giáo án này</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
