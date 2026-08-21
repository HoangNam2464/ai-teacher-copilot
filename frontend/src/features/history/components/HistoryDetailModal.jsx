import React from 'react';
import { Modal } from '../../../core/components/ui/Modal';
import { Button } from '../../../core/components/ui/Button';
import { Badge } from '../../../core/components/ui/Badge';
import { formatDate } from '../../../core/utils/formatters';
import {
	IconFileText,
	IconTarget,
	IconClock,
	IconInfo,
	IconCheck,
	IconLightbulb,
} from '../../../core/components/icons/SvgIcons';

export function HistoryDetailModal({ isOpen, onClose, item }) {
	if (!item) return null;

	const isLessonPlan = item.contentType === 'LESSON_PLAN';
	const content = item.contentData;

	const renderContentData = () => {
		if (!content) {
			return (
				<div
					style={{
						padding: 'var(--space-6) var(--space-4)',
						textAlign: 'center',
						backgroundColor: 'var(--color-bg-subtle)',
						borderRadius: 'var(--radius-md)',
						border: '1px solid var(--color-border)',
					}}
				>
					<span style={{ color: 'var(--color-text-muted)', display: 'inline-flex', marginBottom: 'var(--space-2)' }}>
						<IconInfo size={24} />
					</span>
					<p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
						Nội dung chi tiết của bản ghi này chưa có sẵn trong cơ sở dữ liệu.
					</p>
				</div>
			);
		}

		// 1. Render Lesson Plan Detail
		if (isLessonPlan) {
			const objectives = Array.isArray(content.objectives)
				? content.objectives
				: content.objectives ? [content.objectives] : [];
			const activities = Array.isArray(content.activities) ? content.activities : [];

			return (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
					{/* Objectives */}
					{objectives.length > 0 && (
						<div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
							<h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', margin: '0 0 var(--space-2) 0' }}>
								Mục Tiêu Bài Học
							</h4>
							<ul style={{ margin: 0, paddingLeft: '20px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
								{objectives.map((obj, idx) => (
									<li key={idx} style={{ marginBottom: '4px' }}>{obj}</li>
								))}
							</ul>
						</div>
					)}

					{/* Activities Timeline */}
					{activities.length > 0 && (
						<div>
							<h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', margin: '0 0 var(--space-2) 0' }}>
								Tiến Trình Hoạt Động Giảng Dạy ({activities.length} hoạt động)
							</h4>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2-5)' }}>
								{activities.map((act, idx) => (
									<div
										key={idx}
										style={{
											padding: 'var(--space-3)',
											backgroundColor: 'var(--color-bg-surface)',
											borderRadius: 'var(--radius-md)',
											border: '1px solid var(--color-border)',
											fontSize: 'var(--font-size-xs)',
										}}
									>
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
											<strong style={{ color: 'var(--color-primary)' }}>
												Hoạt động {act.step_number || idx + 1}: {act.title || act.name || 'Hoạt động'}
											</strong>
											{act.duration_minutes && (
												<Badge variant="neutral">{act.duration_minutes} phút</Badge>
											)}
										</div>
										{act.description && (
											<p style={{ margin: '4px 0', color: 'var(--color-text-secondary)' }}>{act.description}</p>
										)}
										{act.teacher_activities && (
											<div style={{ marginTop: '4px', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-2xs)' }}>
												<strong>Giáo viên:</strong> {act.teacher_activities}
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			);
		}

		// 2. Render Quiz Detail
		const questions = Array.isArray(content.questions) ? content.questions : [];
		if (questions.length > 0) {
			const optionLabels = ['A', 'B', 'C', 'D'];

			return (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
					<h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', margin: '0 0 var(--space-1) 0' }}>
						Danh Sách Câu Hỏi Trắc Nghiệm ({questions.length} câu)
					</h4>

					{questions.map((q, qIdx) => {
						const opts = Array.isArray(q.options) ? q.options : [];
						const correctIdx = typeof q.correct_answer_index === 'number' ? q.correct_answer_index : -1;

						return (
							<div
								key={qIdx}
								style={{
									padding: 'var(--space-3)',
									backgroundColor: 'var(--color-bg-surface)',
									borderRadius: 'var(--radius-md)',
									border: '1px solid var(--color-border)',
								}}
							>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
									<span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
										Câu {qIdx + 1}: {q.question}
									</span>
									{q.bloom_level && (
										<Badge variant="info" style={{ fontSize: 'var(--font-size-2xs)' }}>{q.bloom_level}</Badge>
									)}
								</div>

								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
									{opts.map((opt, oIdx) => {
										const isCorrect = oIdx === correctIdx;
										return (
											<div
												key={oIdx}
												style={{
													padding: 'var(--space-2) var(--space-2-5)',
													borderRadius: 'var(--radius-sm)',
													border: `1px solid ${isCorrect ? 'var(--color-success-border)' : 'var(--color-border)'}`,
													backgroundColor: isCorrect ? 'var(--color-success-light)' : 'var(--color-bg-subtle)',
													fontSize: 'var(--font-size-xs)',
													color: isCorrect ? 'var(--color-success-text)' : 'var(--color-text-secondary)',
													display: 'flex',
													alignItems: 'center',
													gap: '6px',
												}}
											>
												<strong style={{ fontFamily: 'var(--font-family-mono)' }}>{optionLabels[oIdx] || oIdx + 1}.</strong>
												<span>{opt}</span>
												{isCorrect && <IconCheck size={12} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
											</div>
										);
									})}
								</div>

								{q.explanation && (
									<div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
										<IconLightbulb size={14} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '1px' }} />
										<span><strong>Giải thích:</strong> {q.explanation}</span>
									</div>
								)}
							</div>
						);
					})}
				</div>
			);
		}

		// Generic JSON string preview if structure is arbitrary
		return (
			<pre style={{ margin: 0, padding: 'var(--space-3)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-2xs)', fontFamily: 'var(--font-family-mono)', overflowX: 'auto' }}>
				{typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
			</pre>
		);
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={isLessonPlan ? 'Chi Tiết Giáo Án Đã Sinh' : 'Chi Tiết Đề Thi Đã Sinh'}
			size="lg"
			footer={
				<Button variant="secondary" onClick={onClose}>
					Đóng
				</Button>
			}
		>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
				{/* Header Metadata Ribbon */}
				<div
					style={{
						padding: 'var(--space-3) var(--space-4)',
						backgroundColor: 'var(--color-bg-subtle)',
						borderRadius: 'var(--radius-md)',
						border: '1px solid var(--color-border)',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						flexWrap: 'wrap',
						gap: 'var(--space-2)',
					}}
				>
					<div>
						<h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', margin: 0 }}>
							{item.title || 'Bài soạn không tên'}
						</h3>
						<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '2px', fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
							<span>{item.subject || 'Chung'} {item.gradeLevel ? `• ${item.gradeLevel}` : ''}</span>
							<span>•</span>
							<span style={{ fontFamily: 'var(--font-family-mono)' }}>{formatDate(item.createdAt)}</span>
						</div>
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
						<Badge variant={isLessonPlan ? 'primary' : 'info'}>
							{isLessonPlan ? 'Giáo án' : 'Đề thi'}
						</Badge>
						{item.version && <Badge variant="neutral">v{item.version}</Badge>}
						{item.reviewStatus && (
							<Badge variant={item.reviewStatus === 'APPROVED' ? 'success' : 'neutral'}>
								{item.reviewStatus}
							</Badge>
						)}
					</div>
				</div>

				{/* Content Body */}
				{renderContentData()}
			</div>
		</Modal>
	);
}
