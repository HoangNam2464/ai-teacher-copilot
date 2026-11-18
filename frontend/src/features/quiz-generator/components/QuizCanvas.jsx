import React, { useState } from 'react';
import { Card } from '../../../core/components/ui/Card';
import { Button } from '../../../core/components/ui/Button';
import { Badge } from '../../../core/components/ui/Badge';
import { DraftDisclaimerBanner } from '../../../core/components/feedback/DraftDisclaimerBanner';
import { ExportDropdown } from '../../../core/components/export/ExportDropdown';
import { QuestionCard } from './QuestionCard';
import {
  IconTarget,
  IconBookOpen,
  IconEdit,
  IconCopy,
  IconCheck,
  IconRefresh,
  IconPlus,
} from '../../../core/components/icons/SvgIcons';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export function QuizCanvas({
  quiz,
  workspace,
  localVersion = 1,
  sessionReviewStatus = 'DRAFT',
  onUpdateQuiz,
  onApprove,
  onOpenRegenerate,
  onOpenCitations,
  isRegenerating = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(quiz);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const activeQuiz = isEditing ? editDraft : quiz;
  const isApproved = sessionReviewStatus === 'APPROVED_SESSION';
  const questions = activeQuiz?.questions || [];

  const handleStartEdit = () => {
    setEditDraft(JSON.parse(JSON.stringify(quiz)));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onUpdateQuiz(editDraft);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditDraft(quiz);
    setIsEditing(false);
  };

  const handleAddQuestion = () => {
    const currentQuestions = editDraft.questions || [];
    const newQ = {
      question_text: `Câu hỏi ${currentQuestions.length + 1}`,
      options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      correct_answer_index: 0,
      bloom_taxonomy_level: 'Understand',
      explanation: '',
    };
    setEditDraft({
      ...editDraft,
      questions: [...currentQuestions, newQ],
    });
  };

  const handleUpdateQuestion = (index, updatedItem) => {
    const currentQuestions = [...(editDraft.questions || [])];
    currentQuestions[index] = updatedItem;
    setEditDraft({
      ...editDraft,
      questions: currentQuestions,
    });
  };

  const handleDeleteQuestion = (indexToDelete) => {
    const currentQuestions = editDraft.questions || [];
    setEditDraft({
      ...editDraft,
      questions: currentQuestions.filter((_, i) => i !== indexToDelete),
    });
  };

  const handleCopyMarkdown = async () => {
    const markdownLines = [];
    markdownLines.push(`# ${activeQuiz.title || 'Đề kiểm tra & câu hỏi trắc nghiệm'}\n`);
    markdownLines.push(`**Môn học:** ${workspace?.subject || 'Chung'} | **Khối lớp:** ${workspace?.gradeLevel || 'K12'}`);
    markdownLines.push(`**Tổng số câu:** ${questions.length} câu | **Phiên bản:** v${localVersion} (Bản thảo trong phiên làm việc)\n`);
    markdownLines.push(`---\n`);

    questions.forEach((q, idx) => {
      markdownLines.push(`### Câu ${idx + 1}: ${q.question_text || ''}`);
      if (q.bloom_taxonomy_level) {
        markdownLines.push(`*Mức độ tư duy:* ${q.bloom_taxonomy_level}`);
      }
      markdownLines.push('');

      const opts = Array.isArray(q.options) ? q.options : [];
      opts.forEach((opt, optIdx) => {
        markdownLines.push(`${OPTION_LETTERS[optIdx] || '-'}. ${opt}`);
      });
      markdownLines.push('');

      const correctLetter = OPTION_LETTERS[q.correct_answer_index] || 'A';
      markdownLines.push(`**Đáp án đúng:** ${correctLetter}`);
      if (q.explanation) {
        markdownLines.push(`**Giải thích:** ${q.explanation}`);
      }
      markdownLines.push('\n---\n');
    });

    try {
      await navigator.clipboard.writeText(markdownLines.join('\n'));
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2200);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  // Calculate actual Bloom taxonomy distribution
  const bloomCounts = questions.reduce((acc, q) => {
    const level = q.bloom_taxonomy_level || 'Understand';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* 1. Draft Disclaimer Banner */}
      <DraftDisclaimerBanner
        status={isApproved ? 'APPROVED' : 'DRAFT'}
        version={localVersion}
      />

      {/* 2. Main Quiz Card */}
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
            marginBottom: 'var(--space-4)',
          }}
        >
          <div style={{ flex: 1, minWidth: '240px' }}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
                  Tiêu đề đề thi:
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}
                  value={editDraft.title || ''}
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
                  {activeQuiz.title || 'Đề kiểm tra trắc nghiệm'}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-1)', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <IconTarget size={13} />
                    <span>Quy mô: <strong>{questions.length} câu hỏi</strong></span>
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
            <button
              type="button"
              className="citation-badge"
              onClick={onOpenCitations}
              title="Xem trạng thái căn cứ học liệu RAG"
            >
              <IconBookOpen size={12} />
              <span>Căn cứ học liệu</span>
            </button>

            {/* Copy Markdown Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyMarkdown}
              icon={copyFeedback ? <IconCheck size={14} /> : <IconCopy size={14} />}
              title="Sao chép toàn bộ đề thi dạng Markdown"
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
                title="Chỉnh sửa nội dung đề thi"
              >
                <span>Chỉnh sửa</span>
              </Button>
            )}

            {/* Export Dropdown */}
            <ExportDropdown
              workspaceId={workspace?.id}
              defaultFileName={`de-thi-${activeQuiz.title || 'kiem-tra'}`}
            />
          </div>
        </div>

        {/* 3. Bloom Taxonomy Distribution Summary */}
        {Object.keys(bloomCounts).length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              flexWrap: 'wrap',
              padding: 'var(--space-2-5) var(--space-3)',
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <span style={{ fontSize: 'var(--font-size-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}>
              Phân bố Bloom:
            </span>
            {Object.entries(bloomCounts).map(([level, count]) => (
              <Badge key={level} variant="neutral" style={{ fontSize: 'var(--font-size-2xs)' }}>
                {level}: <strong>{count}</strong>
              </Badge>
            ))}
          </div>
        )}

        {/* 4. Question List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          {questions.length === 0 ? (
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: 'var(--space-4)', textAlign: 'center', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              Chưa có câu hỏi nào trong đề thi.
            </p>
          ) : (
            questions.map((q, idx) => (
              <QuestionCard
                key={idx}
                index={idx}
                question={q}
                isEditing={isEditing}
                onChange={(updated) => handleUpdateQuestion(idx, updated)}
                onDelete={isEditing ? () => handleDeleteQuestion(idx) : null}
              />
            ))
          )}

          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddQuestion}
              icon={<IconPlus size={14} />}
              style={{ alignSelf: 'flex-start' }}
            >
              Thêm câu hỏi mới
            </Button>
          )}
        </div>

        {/* 5. Session Action Footer */}
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
                <span>Duyệt đề thi này</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
