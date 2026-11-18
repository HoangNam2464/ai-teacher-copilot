import React from 'react';
import { IconCheck, IconLightbulb, IconTrash } from '../../../core/components/icons/SvgIcons';
import { Badge } from '../../../core/components/ui/Badge';
import { APP_CONFIG } from '../../../core/constants/appConfig';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

function getBloomBadgeVariant(bloomLevel) {
  const level = (bloomLevel || '').toLowerCase();
  if (level.includes('remember') || level.includes('ghi nhớ')) return 'bloom-remember';
  if (level.includes('understand') || level.includes('thấu hiểu') || level.includes('thông hiểu')) return 'bloom-understand';
  if (level.includes('apply') || level.includes('vận dụng') && !level.includes('cao')) return 'bloom-apply';
  if (level.includes('analyze') || level.includes('phân tích')) return 'bloom-analyze';
  if (level.includes('evaluate') || level.includes('đánh giá')) return 'bloom-evaluate';
  if (level.includes('create') || level.includes('sáng tạo') || level.includes('vận dụng cao')) return 'bloom-create';
  return 'primary';
}

export function QuestionCard({
  question,
  index,
  isEditing = false,
  onChange,
  onDelete,
}) {
  const {
    question_text = '',
    options = [],
    correct_answer_index = 0,
    bloom_taxonomy_level = 'Understand',
    explanation = '',
  } = question || {};

  const normalizedOptions = Array.isArray(options) && options.length === 4
    ? options
    : [options[0] || '', options[1] || '', options[2] || '', options[3] || ''];

  if (isEditing) {
    return (
      <div
        style={{
          padding: 'var(--space-5)',
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-primary-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        {/* Header edit */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span
              style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-primary)',
                backgroundColor: 'var(--color-primary-light)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              Câu {index + 1}
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
              Cấp độ Bloom:
            </span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: 'var(--space-1) var(--space-2-5)', fontSize: 'var(--font-size-xs)' }}
              value={bloom_taxonomy_level}
              onChange={(e) => onChange({ ...question, bloom_taxonomy_level: e.target.value })}
            >
              {APP_CONFIG.BLOOM_LEVELS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>

          {onDelete && (
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-icon text-danger"
              onClick={onDelete}
              title={`Xóa câu hỏi ${index + 1}`}
              aria-label={`Xóa câu hỏi ${index + 1}`}
            >
              <IconTrash size={16} />
            </button>
          )}
        </div>

        {/* Question text edit */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 'var(--font-weight-medium)' }}>
            Nội dung câu hỏi:
          </label>
          <textarea
            className="form-textarea"
            rows={2}
            style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}
            placeholder="Nhập nội dung câu hỏi..."
            value={question_text}
            onChange={(e) => onChange({ ...question, question_text: e.target.value })}
          />
        </div>

        {/* 4 Options Edit */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-weight-medium)' }}>
            4 Phương án trả lời (chọn Radio để đánh dấu đáp án đúng):
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {normalizedOptions.map((opt, optIdx) => {
              const isCorrect = correct_answer_index === optIdx;
              return (
                <div
                  key={optIdx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2)',
                    backgroundColor: isCorrect ? 'var(--color-success-light)' : 'var(--color-bg-subtle)',
                    border: `1px solid ${isCorrect ? 'var(--color-success-border)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-1-5)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-bold)',
                      fontFamily: 'var(--font-family-mono)',
                      color: isCorrect ? 'var(--color-success-text)' : 'var(--color-text-primary)',
                      minWidth: '42px',
                    }}
                  >
                    <input
                      type="radio"
                      name={`correct-answer-q-${index}`}
                      checked={isCorrect}
                      onChange={() => onChange({ ...question, correct_answer_index: optIdx })}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{OPTION_LETTERS[optIdx]}.</span>
                  </label>

                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1, padding: 'var(--space-1) var(--space-2-5)', fontSize: 'var(--font-size-xs)' }}
                    placeholder={`Nội dung phương án ${OPTION_LETTERS[optIdx]}...`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...normalizedOptions];
                      newOpts[optIdx] = e.target.value;
                      onChange({ ...question, options: newOpts });
                    }}
                  />

                  {isCorrect && (
                    <span className="badge badge-success" style={{ fontSize: 'var(--font-size-2xs)' }}>
                      Đáp án đúng
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Explanation edit */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 'var(--font-weight-medium)' }}>
            Lời giải thích căn cứ học liệu:
          </label>
          <textarea
            className="form-textarea"
            rows={2}
            style={{ fontSize: 'var(--font-size-xs)' }}
            placeholder="Giải thích lý do chọn đáp án này..."
            value={explanation}
            onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          />
        </div>
      </div>
    );
  }

  // View Mode
  const bloomVariant = getBloomBadgeVariant(bloom_taxonomy_level);

  return (
    <div
      style={{
        padding: 'var(--space-5)',
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xs)',
        transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
      }}
    >
      {/* Question Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2-5)', flex: 1 }}>
          <span
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-primary)',
              backgroundColor: 'var(--color-primary-light)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              flexShrink: 0,
              marginTop: '1px',
            }}
          >
            Câu {index + 1}
          </span>
          <h4
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              lineHeight: 'var(--line-height-normal)',
              margin: 0,
            }}
          >
            {question_text || 'Chưa có nội dung câu hỏi.'}
          </h4>
        </div>

        {bloom_taxonomy_level && (
          <Badge variant={bloomVariant} style={{ flexShrink: 0 }}>
            {bloom_taxonomy_level}
          </Badge>
        )}
      </div>

      {/* 4 Options Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-2-5)',
          marginBottom: 'var(--space-3)',
        }}
      >
        {normalizedOptions.map((opt, optIdx) => {
          const isCorrect = correct_answer_index === optIdx;
          return (
            <div
              key={optIdx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-2-5) var(--space-3)',
                backgroundColor: isCorrect ? 'var(--color-success-light)' : 'var(--color-bg-subtle)',
                border: `1px solid ${isCorrect ? 'var(--color-success-border)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)',
                transition: 'background-color var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: isCorrect ? 'var(--color-success-text)' : 'var(--color-text-secondary)',
                  }}
                >
                  {OPTION_LETTERS[optIdx]}.
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: isCorrect ? 'var(--color-success-text)' : 'var(--color-text-primary)',
                    fontWeight: isCorrect ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)',
                  }}
                >
                  {typeof opt === 'string' ? opt : String(opt)}
                </span>
              </div>

              {isCorrect && (
                <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-2xs)', fontWeight: 'var(--font-weight-semibold)' }}>
                  <IconCheck size={14} />
                  <span>Đúng</span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation / Grounded Callout */}
      {explanation && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-2-5)',
            padding: 'var(--space-2-5) var(--space-3)',
            backgroundColor: 'var(--color-bg-subtle)',
            borderLeft: '3px solid var(--color-primary)',
            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          }}
        >
          <span style={{ color: 'var(--color-primary)', marginTop: '2px', display: 'flex' }}>
            <IconLightbulb size={16} />
          </span>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-normal)' }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Giải thích căn cứ: </strong>
            <span>{explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
}
