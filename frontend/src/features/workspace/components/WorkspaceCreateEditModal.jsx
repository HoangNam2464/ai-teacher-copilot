import React, { useState, useEffect } from 'react';
import { Modal } from '../../../core/components/ui/Modal';
import { Button } from '../../../core/components/ui/Button';
import { IconSchool, IconCheck, IconAlertCircle } from '../../../core/components/icons/SvgIcons';

export function WorkspaceCreateEditModal({
  isOpen,
  onClose,
  onSubmit,
  workspace = null,
  loading = false,
}) {
  const isEditMode = Boolean(workspace && workspace.id);

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (workspace && isEditMode) {
      setName(workspace.name || '');
      setSubject(workspace.subject || '');
      setGradeLevel(workspace.gradeLevel || '');
      setDescription(workspace.description || '');
    } else {
      setName('');
      setSubject('');
      setGradeLevel('');
      setDescription('');
    }
    setError('');
  }, [workspace, isEditMode, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tên không gian làm việc là bắt buộc.');
      return;
    }

    try {
      setError('');
      await onSubmit({
        name: name.trim(),
        subject: subject.trim() || undefined,
        gradeLevel: gradeLevel.trim() || undefined,
        description: description.trim() || undefined,
      });
    } catch (err) {
      console.error('Workspace form submit error:', err);
      setError(err.response?.data?.message || 'Thao tác không gian làm việc thất bại. Vui lòng thử lại.');
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Chỉnh Sửa Không Gian Làm Việc' : 'Tạo Không Gian Làm Việc Mới'}
      size="md"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={!name.trim() || loading}
            icon={<IconCheck size={16} />}
          >
            {isEditMode ? 'Lưu thay đổi' : 'Tạo không gian'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 'var(--line-height-normal)' }}>
          {isEditMode
            ? 'Cập nhật thông tin nhận diện, môn học và khối lớp cho không gian làm việc này.'
            : 'Tạo một không gian riêng biệt để quản lý tài liệu học liệu, soạn giáo án và tạo đề thi theo môn học hoặc lớp giảng dạy.'}
        </p>

        {/* Error alert */}
        {error && (
          <div
            style={{
              padding: 'var(--space-2-5) var(--space-3)',
              backgroundColor: 'var(--color-danger-light)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-danger-text)',
              fontSize: 'var(--font-size-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
            role="alert"
          >
            <IconAlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Name Field */}
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>
            Tên không gian làm việc *
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Ví dụ: Toán 10 - Năm học 2026"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Subject & Grade Level in Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>
              Môn học
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Toán học, Ngữ văn..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>
              Khối lớp
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Lớp 10, Lớp 11..."
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Description Field */}
        <div className="form-group">
          <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>
            Mô tả / Ghi chú thêm
          </label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Ghi chú về học phần, danh sách lớp hoặc mục tiêu giảng dạy..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            style={{ fontSize: 'var(--font-size-xs)' }}
          />
        </div>
      </form>
    </Modal>
  );
}
