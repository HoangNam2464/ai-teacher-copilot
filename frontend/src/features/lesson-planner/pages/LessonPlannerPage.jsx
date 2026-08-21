import React, { useState } from 'react';
import { lessonPlannerApi } from '../services/lessonPlannerApi';
import { useWorkspace } from '../../../core/hooks/useWorkspace';
import { Button } from '../../../core/components/ui/Button';
import { Card } from '../../../core/components/ui/Card';
import { Badge } from '../../../core/components/ui/Badge';
import { Spinner } from '../../../core/components/ui/Spinner';
import { EmptyState } from '../../../core/components/feedback/EmptyState';
import { InsufficientEvidenceAlert } from '../../../core/components/feedback/InsufficientEvidenceAlert';
import { CitationDrawer } from '../../../core/components/citation/CitationDrawer';
import { LessonPlanCanvas } from '../components/LessonPlanCanvas';
import { LocalRegenerateModal } from '../components/LocalRegenerateModal';
import {
  IconSparkles,
  IconBookOpen,
  IconClock,
  IconSchool,
  IconAlertTriangle,
} from '../../../core/components/icons/SvgIcons';

function normalizeLessonPlanResponse(rawResponse, defaultTopic = '') {
  const root = rawResponse?.data?.data || rawResponse?.data || rawResponse || {};

  const title = root.title || defaultTopic || 'Kế hoạch bài dạy';

  const objective = typeof root.objective === 'string'
    ? root.objective
    : Array.isArray(root.objectives)
      ? root.objectives.join('\n')
      : '';

  const sections = Array.isArray(root.sections)
    ? root.sections.map((s) => ({
        title: s.title || 'Hoạt động',
        duration_minutes: Number(s.duration_minutes) || 10,
        content: s.content || '',
      }))
    : [];

  const materials_needed = Array.isArray(root.materials_needed)
    ? root.materials_needed
    : [];

  const source_chunk_ids = Array.isArray(root.source_chunk_ids)
    ? root.source_chunk_ids
    : [];

  return {
    title,
    objective,
    sections,
    materials_needed,
    source_chunk_ids,
  };
}

export function LessonPlannerPage() {
  const { activeWorkspace } = useWorkspace();
  const [topic, setTopic] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [instructions, setInstructions] = useState('');

  const [loading, setLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [isInsufficientEvidence, setIsInsufficientEvidence] = useState(false);

  const [currentPlan, setCurrentPlan] = useState(null);
  const [localVersion, setLocalVersion] = useState(1);
  const [sessionReviewStatus, setSessionReviewStatus] = useState('DRAFT');

  const [citations, setCitations] = useState([]);
  const [isCitationOpen, setIsCitationOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!activeWorkspace?.id) {
      setError('Vui lòng chọn không gian làm việc trước khi thực hiện.');
      return;
    }
    if (!topic.trim()) {
      setError('Vui lòng nhập chủ đề bài dạy.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setIsInsufficientEvidence(false);

      const payload = {
        subject: activeWorkspace.subject || 'Toán học',
        gradeLevel: activeWorkspace.gradeLevel || 'Lớp 10',
        topic: topic.trim(),
        instructions: instructions.trim() || undefined,
      };

      const rawData = await lessonPlannerApi.generateLessonPlan(activeWorkspace.id, payload);
      const normalized = normalizeLessonPlanResponse(rawData, topic.trim());

      const fetchedCitations = rawData?.citations || rawData?.data?.citations || [];
      setCitations(fetchedCitations);

      setCurrentPlan(normalized);
      setLocalVersion(1);
      setSessionReviewStatus('DRAFT');
    } catch (err) {
      console.error('Generation failed:', err);
      if (err.response?.status === 422) {
        setIsInsufficientEvidence(true);
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Sinh giáo án thất bại. Vui lòng kiểm tra lại kết nối hoặc tài liệu.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (refinementPrompt) => {
    if (!activeWorkspace?.id || !currentPlan) return;

    try {
      setIsRegenerating(true);
      setError('');

      const combinedInstructions = instructions
        ? `${instructions}\n[Yêu cầu tinh chỉnh]: ${refinementPrompt}`
        : `[Yêu cầu tinh chỉnh]: ${refinementPrompt}`;

      const payload = {
        subject: activeWorkspace.subject || 'Toán học',
        gradeLevel: activeWorkspace.gradeLevel || 'Lớp 10',
        topic: currentPlan.title || topic.trim(),
        instructions: combinedInstructions,
      };

      const rawData = await lessonPlannerApi.generateLessonPlan(activeWorkspace.id, payload);
      const normalized = normalizeLessonPlanResponse(rawData, currentPlan.title);

      setCurrentPlan(normalized);
      setLocalVersion((prev) => prev + 1);
      setSessionReviewStatus('DRAFT');
      setIsRegenerateModalOpen(false);
    } catch (err) {
      console.error('Regeneration failed:', err);
      setError(err.response?.data?.error || 'Sinh lại giáo án thất bại. Vui lòng thử lại.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleUpdatePlan = (updatedPlan) => {
    setCurrentPlan(updatedPlan);
    if (sessionReviewStatus === 'APPROVED_SESSION') {
      setSessionReviewStatus('DRAFT');
    }
  };

  const handleApprove = () => {
    setSessionReviewStatus('APPROVED_SESSION');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            Soạn Giáo Án AI
          </h1>
          <Badge variant="primary">AI Copilot</Badge>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Kiến tạo kế hoạch bài dạy chuẩn mực sư phạm, đối chiếu nguồn học liệu RAG và biên tập linh hoạt.
        </p>
      </div>

      {/* 2. Two-Pane Authoring Workspace */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}
      >
        {/* Left Pane: Pedagogy Setup Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Card>
            {/* Workspace Context Ribbon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-2-5) var(--space-3)',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-4)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', overflow: 'hidden' }}>
                <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
                  <IconSchool size={16} />
                </span>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {activeWorkspace?.name || 'Chưa chọn Không gian'}
                </span>
              </div>
              <Badge variant="neutral" style={{ fontSize: 'var(--font-size-2xs)' }}>
                {activeWorkspace?.subject || 'Chung'} • {activeWorkspace?.gradeLevel || 'K12'}
              </Badge>
            </div>

            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)' }}>
              Thiết Lập Yêu Cầu Bài Dạy
            </h3>

            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Topic Field */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>
                  Chủ đề / Tên bài dạy *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Định lý Cosin và ứng dụng giải tam giác"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Duration Field */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>
                  Thời lượng dự kiến (phút)
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <input
                    type="number"
                    className="form-input"
                    min={15}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    disabled={loading}
                    style={{ maxWidth: '120px' }}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <Button
                      type="button"
                      variant={durationMinutes === 45 ? 'primary' : 'outline'}
                      size="xs"
                      onClick={() => setDurationMinutes(45)}
                      disabled={loading}
                    >
                      45p
                    </Button>
                    <Button
                      type="button"
                      variant={durationMinutes === 90 ? 'primary' : 'outline'}
                      size="xs"
                      onClick={() => setDurationMinutes(90)}
                      disabled={loading}
                    >
                      90p
                    </Button>
                  </div>
                </div>
              </div>

              {/* Instructions Field */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>
                  Chỉ dẫn sư phạm bổ sung
                </label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Ví dụ:&#10;- Chú trọng hoạt động thảo luận nhóm 4 học sinh&#10;- Bổ sung câu hỏi mở gợi ý tư duy thực tế&#10;- Tích hợp giáo dục STEM..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  disabled={loading}
                  style={{ fontSize: 'var(--font-size-xs)' }}
                />
              </div>

              {/* Insufficient Evidence Alert */}
              {isInsufficientEvidence && (
                <InsufficientEvidenceAlert
                  message="Kho tri thức của không gian làm việc này chưa có đủ tài liệu liên quan để soạn giáo án theo yêu cầu."
                />
              )}

              {/* General Error Alert */}
              {error && !isInsufficientEvidence && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-2-5)',
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: 'var(--color-danger-light)',
                    border: '1px solid var(--color-danger-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-danger-text)',
                    fontSize: 'var(--font-size-xs)',
                  }}
                  role="alert"
                >
                  <IconAlertTriangle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading || !topic.trim()}
                icon={<IconSparkles size={16} />}
                style={{ width: '100%', marginTop: 'var(--space-1)' }}
              >
                {loading ? 'Đang nghiên cứu học liệu...' : 'Bắt đầu sinh giáo án AI'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Pane: Lesson Authoring Canvas */}
        <div>
          {loading ? (
            <Card style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spinner message="AI đang nghiên cứu học liệu và xây dựng kế hoạch bài dạy..." size="lg" />
            </Card>
          ) : !currentPlan ? (
            <EmptyState
              icon={IconBookOpen}
              title="Chưa có giáo án nào được tạo"
              description="Nhập thông tin chủ đề bài học bên trái và nhấn 'Bắt đầu sinh giáo án AI' để hệ thống kiến tạo kế hoạch bài dạy bám sát học liệu."
            />
          ) : (
            <LessonPlanCanvas
              plan={currentPlan}
              workspace={activeWorkspace}
              localVersion={localVersion}
              sessionReviewStatus={sessionReviewStatus}
              onUpdatePlan={handleUpdatePlan}
              onApprove={handleApprove}
              onOpenRegenerate={() => setIsRegenerateModalOpen(true)}
              onOpenCitations={() => setIsCitationOpen(true)}
              isRegenerating={isRegenerating}
            />
          )}
        </div>
      </div>

      {/* 3. Session-Local Regenerate Modal */}
      <LocalRegenerateModal
        isOpen={isRegenerateModalOpen}
        onClose={() => setIsRegenerateModalOpen(false)}
        onSubmit={handleRegenerate}
        loading={isRegenerating}
      />

      {/* 4. Citation Drawer */}
      <CitationDrawer
        isOpen={isCitationOpen}
        onClose={() => setIsCitationOpen(false)}
        citations={citations}
      />
    </div>
  );
}
