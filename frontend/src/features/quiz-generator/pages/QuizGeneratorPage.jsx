import React, { useState } from 'react';
import { quizApi } from '../services/quizApi';
import { useWorkspace } from '../../../core/hooks/useWorkspace';
import { Button } from '../../../core/components/ui/Button';
import { Card } from '../../../core/components/ui/Card';
import { Badge } from '../../../core/components/ui/Badge';
import { BloomTaxonomyTag } from '../../../core/components/ui/BloomTaxonomyTag';
import { CitationBadge } from '../../../core/components/citation/CitationBadge';
import { CitationDrawer } from '../../../core/components/citation/CitationDrawer';
import { ExportDropdown } from '../../../core/components/export/ExportDropdown';
import { APP_CONFIG } from '../../../core/constants/appConfig';

export function QuizGeneratorPage() {
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
      alert('Vui lòng chọn không gian làm việc trước.');
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
        setError('Không đủ tài liệu liên quan trong kho tri thức để tạo đề kiểm tra này (Insufficient Evidence). Vui lòng nạp thêm tài liệu.');
      } else {
        setError(err.response?.data?.message || 'Tạo đề kiểm tra thất bại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const quiz = result?.contentData || result?.quiz;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Tạo Đề Thi & Câu Hỏi AI (Quiz Generator)</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          Sinh trắc nghiệm và câu hỏi tự luận ngắn gắn nhãn Bloom's Taxonomy bám sát tài liệu học liệu
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1.3fr' : '1fr', gap: '1.5rem' }}>
        {/* Input Form */}
        <Card>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Thiết Lập Đề Kiểm Tra</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Chủ đề kiểm tra *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: Phương trình lượng giác cơ bản"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Số lượng câu hỏi (3 - 20)</label>
                <input
                  type="number"
                  className="form-input"
                  min={3}
                  max={20}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Độ khó</label>
                <select
                  className="form-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  {APP_CONFIG.DIFFICULTY_LEVELS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mức độ tư duy Bloom Taxonomy trọng tâm</label>
              <select
                className="form-select"
                value={targetBloomLevel}
                onChange={(e) => setTargetBloomLevel(e.target.value)}
              >
                {APP_CONFIG.BLOOM_LEVELS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Yêu cầu bổ sung</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Ví dụ: Tập trung câu hỏi thực tiễn đời sống..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' }}>
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" loading={loading} style={{ width: '100%' }}>
              ✨ Sinh đề thi & câu hỏi AI
            </Button>
          </form>
        </Card>

        {/* Output Preview */}
        {result && quiz && (
          <div>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {quiz.title || topic}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    Tổng số câu: {quiz.questions?.length || questionCount} • Độ khó: {quiz.difficulty}
                  </p>
                </div>
                <ExportDropdown
                  workspaceId={activeWorkspace?.id}
                  generationId={result.id}
                  defaultFileName={`de-thi-${topic}`}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {quiz.questions?.map((q, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '1rem',
                      background: 'var(--color-bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '0.9375rem' }}>
                        Câu {q.question_number || i + 1}: {q.question_text || q.question}
                      </strong>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', margin: '0.75rem 0' }}>
                        {q.options.map((opt, optIndex) => (
                          <div
                            key={optIndex}
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: 'var(--color-bg-surface)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8125rem',
                            }}
                          >
                            {typeof opt === 'string' ? opt : `${opt.label}. ${opt.text}`}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Explanation / Answer Key */}
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--color-border)', fontSize: '0.8125rem' }}>
                      <p style={{ color: 'var(--color-success-text)', fontWeight: 600 }}>
                        ✓ Đáp án đúng: {q.correct_answer || q.correctAnswer}
                      </p>
                      {q.explanation && (
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                          💡 Giải thích: {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <CitationDrawer
              isOpen={isCitationOpen}
              onClose={() => setIsCitationOpen(false)}
              citations={[{ chunkId: '1', fileName: 'Tài liệu nguồn trích dẫn', excerpt: 'Nội dung chunk đã trích xuất qua RAG vector search.' }]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
