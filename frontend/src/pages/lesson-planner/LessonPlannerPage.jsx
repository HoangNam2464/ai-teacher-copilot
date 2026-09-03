import React, { useState } from 'react';
import { lessonPlannerApi } from '@/services/lesson-planner/lessonPlannerApi';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CitationBadge } from '@/components/citation/CitationBadge';
import { CitationDrawer } from '@/components/citation/CitationDrawer';
import { ExportDropdown } from '@/components/export/ExportDropdown';

export function LessonPlannerPage() {
  const { activeWorkspace } = useWorkspace();
  const [topic, setTopic] = useState('');
  const [objectives, setObjectives] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
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
        objectives: objectives ? objectives.split('\n').filter((s) => s.trim()) : [],
        durationMinutes: Number(durationMinutes),
        instructions,
      };

      const data = await lessonPlannerApi.generateLessonPlan(activeWorkspace.id, payload);
      setResult(data);
    } catch (err) {
      console.error('Generation failed:', err);
      if (err.response?.status === 422) {
        setError('Hệ thống không tìm thấy đủ tài liệu liên quan trong kho tri thức để soạn giáo án này (Insufficient Evidence). Vui lòng nạp thêm tài liệu.');
      } else {
        setError(err.response?.data?.message || 'Sinh giáo án thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const plan = result?.contentData || result?.lessonPlan;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Soạn Giáo Án AI (AI Lesson Planner)</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          Sinh kế hoạch bài dạy có cấu trúc bám sát tài liệu nguồn được trích xuất từ RAG
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1.2fr' : '1fr', gap: '1.5rem' }}>
        {/* Input Form */}
        <Card>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Thiết Lập Yêu Cầu Soạn Bài</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Chủ đề / Tên bài dạy *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: Định lý Cosin và giải tam giác"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Môn học</label>
                <input
                  type="text"
                  className="form-input"
                  disabled
                  value={activeWorkspace?.subject || 'Toán học'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Thời lượng (phút)</label>
                <input
                  type="number"
                  className="form-input"
                  min={15}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mục tiêu bài học (Mỗi mục tiêu 1 dòng)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="- Nắm vững công thức định lý Cosin&#10;- Áp dụng tính cạnh và góc trong tam giác"
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Chỉ dẫn sư phạm bổ sung</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Ví dụ: Tăng cường hoạt động thảo luận nhóm 4 người..."
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
              ✨ Bắt đầu sinh giáo án AI
            </Button>
          </form>
        </Card>

        {/* Output Preview */}
        {result && plan && (
          <div>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {plan.title || topic}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    Thời lượng: {plan.duration_minutes || durationMinutes} phút • {activeWorkspace?.gradeLevel}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <CitationBadge
                    count={plan.source_chunk_ids?.length || 0}
                    onClick={() => setIsCitationOpen(true)}
                  />
                  <ExportDropdown
                    workspaceId={activeWorkspace?.id}
                    generationId={result.id}
                    defaultFileName={`giao-an-${topic}`}
                  />
                </div>
              </div>

              {plan.objectives && plan.objectives.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.35rem' }}>🎯 Mục tiêu bài dạy</h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {plan.objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.sections && plan.sections.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem' }}>📖 Tiến trình hoạt động</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {plan.sections.map((sec, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '0.875rem',
                          background: 'var(--color-bg-subtle)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <strong style={{ fontSize: '0.875rem' }}>{sec.title}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                            {sec.duration_minutes} phút
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>
                          {sec.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <CitationDrawer
              isOpen={isCitationOpen}
              onClose={() => setIsCitationOpen(false)}
              citations={plan.source_chunk_ids?.map((id) => ({ chunkId: id, fileName: 'Tài liệu nguồn trích dẫn', excerpt: 'Nội dung chunk đã trích xuất qua RAG vector search.' }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
