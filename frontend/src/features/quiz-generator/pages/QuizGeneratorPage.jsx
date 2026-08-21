import React, { useState } from 'react';
import { quizApi } from '../services/quizApi';
import { useWorkspace } from '../../../core/hooks/useWorkspace';
import { Button } from '../../../core/components/ui/Button';
import { Card } from '../../../core/components/ui/Card';
import { Badge } from '../../../core/components/ui/Badge';
import { Spinner } from '../../../core/components/ui/Spinner';
import { EmptyState } from '../../../core/components/feedback/EmptyState';
import { InsufficientEvidenceAlert } from '../../../core/components/feedback/InsufficientEvidenceAlert';
import { CitationDrawer } from '../../../core/components/citation/CitationDrawer';
import { QuizCanvas } from '../components/QuizCanvas';
import { LocalRegenerateModal } from '../components/LocalRegenerateModal';
import { APP_CONFIG } from '../../../core/constants/appConfig';
import {
  IconSparkles,
  IconTarget,
  IconSchool,
  IconAlertTriangle,
} from '../../../core/components/icons/SvgIcons';

function normalizeQuizResponse(rawResponse, defaultTopic = '') {
  const root = rawResponse?.data?.data || rawResponse?.data || rawResponse || {};
  const title = root.title || defaultTopic || 'Đề kiểm tra trắc nghiệm';
  const questions = Array.isArray(root.questions)
    ? root.questions.map((q) => ({
        question_text: q.question_text || q.question || '',
        options: Array.isArray(q.options)
          ? q.options.map((opt) => (typeof opt === 'string' ? opt : `${opt.label || ''}. ${opt.text || ''}`))
          : [],
        correct_answer_index: typeof q.correct_answer_index === 'number' ? q.correct_answer_index : 0,
        bloom_taxonomy_level: q.bloom_taxonomy_level || 'Understand',
        explanation: q.explanation || '',
        source_chunk_ids: Array.isArray(q.source_chunk_ids) ? q.source_chunk_ids : [],
      }))
    : [];

  return {
    title,
    questions,
  };
}

export function QuizGeneratorPage() {
  const { activeWorkspace } = useWorkspace();
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [targetBloomLevel, setTargetBloomLevel] = useState('Understand');
  const [instructions, setInstructions] = useState('');

  const [loading, setLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [isInsufficientEvidence, setIsInsufficientEvidence] = useState(false);

  const [currentQuiz, setCurrentQuiz] = useState(null);
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
      setError('Vui lòng nhập chủ đề kiểm tra.');
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
        numQuestions: Number(numQuestions) || 5,
        instructions: instructions.trim() || undefined,
      };

      const rawData = await quizApi.generateQuiz(activeWorkspace.id, payload);
      const normalized = normalizeQuizResponse(rawData, topic.trim());

      const fetchedCitations = rawData?.citations || rawData?.data?.citations || [];
      setCitations(fetchedCitations);

      setCurrentQuiz(normalized);
      setLocalVersion(1);
      setSessionReviewStatus('DRAFT');
    } catch (err) {
      console.error('Quiz generation failed:', err);
      if (err.response?.status === 422) {
        setIsInsufficientEvidence(true);
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Tạo đề kiểm tra thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (refinementPrompt) => {
    if (!activeWorkspace?.id || !currentQuiz) return;

    try {
      setIsRegenerating(true);
      setError('');

      const combinedInstructions = instructions
        ? `${instructions}\n[Yêu cầu tinh chỉnh]: ${refinementPrompt}`
        : `[Yêu cầu tinh chỉnh]: ${refinementPrompt}`;

      const payload = {
        subject: activeWorkspace.subject || 'Toán học',
        gradeLevel: activeWorkspace.gradeLevel || 'Lớp 10',
        topic: currentQuiz.title || topic.trim(),
        numQuestions: Number(numQuestions) || 5,
        instructions: combinedInstructions,
      };

      const rawData = await quizApi.generateQuiz(activeWorkspace.id, payload);
      const normalized = normalizeQuizResponse(rawData, currentQuiz.title);

      setCurrentQuiz(normalized);
      setLocalVersion((prev) => prev + 1);
      setSessionReviewStatus('DRAFT');
      setIsRegenerateModalOpen(false);
    } catch (err) {
      console.error('Quiz regeneration failed:', err);
      setError(err.response?.data?.error || 'Sinh lại đề thi thất bại. Vui lòng thử lại.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleUpdateQuiz = (updatedQuiz) => {
    setCurrentQuiz(updatedQuiz);
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
            Tạo Đề Thi & Quiz AI
          </h1>
          <Badge variant="primary">AI Generator</Badge>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Kiến tạo ngân hàng câu hỏi trắc nghiệm gắn nhãn Bloom's Taxonomy, highlight đáp án đúng và xuất file đề thi.
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
        {/* Left Pane: Setup Form Card */}
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
              Thiết Lập Đề Kiểm Tra
            </h3>

            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Topic Field */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>
                  Chủ đề kiểm tra *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Phương trình lượng giác cơ bản"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Number of Questions Field with Quick Selection Pills */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>
                  Số lượng câu hỏi (3 - 20 câu)
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <input
                    type="number"
                    className="form-input"
                    min={3}
                    max={20}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(e.target.value)}
                    disabled={loading}
                    style={{ maxWidth: '100px' }}
                  />
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {[5, 10, 15, 20].map((count) => (
                      <Button
                        key={count}
                        type="button"
                        variant={Number(numQuestions) === count ? 'primary' : 'outline'}
                        size="xs"
                        onClick={() => setNumQuestions(count)}
                        disabled={loading}
                      >
                        {count} câu
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Target Bloom Level Focus Select */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>
                  Mức độ tư duy Bloom trọng tâm
                </label>
                <select
                  className="form-select"
                  value={targetBloomLevel}
                  onChange={(e) => setTargetBloomLevel(e.target.value)}
                  disabled={loading}
                  style={{ fontSize: 'var(--font-size-xs)' }}
                >
                  {APP_CONFIG.BLOOM_LEVELS.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>

              {/* Additional Instructions Field */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>
                  Yêu cầu & Chỉ dẫn bổ sung
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Ví dụ:&#10;- Tập trung câu hỏi ứng dụng thực tế đời sống&#10;- Phân hóa câu hỏi mức độ vận dụng cao&#10;- Tránh câu hỏi mẹo..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  disabled={loading}
                  style={{ fontSize: 'var(--font-size-xs)' }}
                />
              </div>

              {/* Insufficient Evidence Alert */}
              {isInsufficientEvidence && (
                <InsufficientEvidenceAlert
                  message="Kho tri thức của không gian làm việc này chưa có đủ tài liệu liên quan để tạo đề thi theo chủ đề trên."
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
                {loading ? 'Đang nghiên cứu học liệu...' : 'Sinh đề thi & câu hỏi AI'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Pane: Quiz Authoring Canvas */}
        <div>
          {loading ? (
            <Card style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spinner message="AI đang nghiên cứu học liệu và tạo ngân hàng câu hỏi..." size="lg" />
            </Card>
          ) : !currentQuiz ? (
            <EmptyState
              icon={IconTarget}
              title="Chưa có đề thi nào được tạo"
              description="Nhập thông tin chủ đề kiểm tra bên trái và nhấn 'Sinh đề thi & câu hỏi AI' để bắt đầu."
            />
          ) : (
            <QuizCanvas
              quiz={currentQuiz}
              workspace={activeWorkspace}
              localVersion={localVersion}
              sessionReviewStatus={sessionReviewStatus}
              onUpdateQuiz={handleUpdateQuiz}
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
