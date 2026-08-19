import React, { useState, useEffect } from 'react';
import { workspaceApi } from '../services/workspaceApi';
import { WorkspaceCard } from '../components/WorkspaceCard';
import { useWorkspace } from '../../../core/hooks/useWorkspace';
import { Button } from '../../../core/components/ui/Button';
import { Spinner } from '../../../core/components/ui/Spinner';

export function WorkspaceListPage() {
  const { workspaces, activeWorkspace, setWorkspaces, setActiveWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [description, setDescription] = useState('');

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await workspaceApi.getWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      await workspaceApi.createWorkspace({ name, subject, gradeLevel, description });
      setName('');
      setSubject('');
      setGradeLevel('');
      setDescription('');
      setIsCreating(false);
      await loadWorkspaces();
    } catch (err) {
      console.error('Failed to create workspace:', err);
      alert('Không thể tạo không gian làm việc. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa không gian làm việc này? Mọi tài liệu và bài giảng bên trong sẽ bị xóa.')) {
      return;
    }
    try {
      await workspaceApi.deleteWorkspace(id);
      await loadWorkspaces();
    } catch (err) {
      console.error('Failed to delete workspace:', err);
      alert('Xóa không gian thất bại.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Không Gian Làm Việc</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            Quản lý và phân nhóm tài liệu giảng dạy theo lớp và môn học
          </p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Hủy bỏ' : '+ Tạo không gian mới'}
        </Button>
      </div>

      {isCreating && (
        <div style={{ background: 'var(--color-bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Tạo Không Gian Giảng Dạy Mới</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Tên không gian *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Toán 10 - Năm học 2026"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Môn học</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Toán, Ngữ văn, Lịch sử..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Khối lớp</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Lớp 10, Lớp 11..."
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Mô tả thêm</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Ghi chú về học phần hoặc lớp giảng dạy..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button type="submit" variant="primary">Lưu không gian làm việc</Button>
          </form>
        </div>
      )}

      {loading && workspaces.length === 0 ? (
        <Spinner message="Đang tải danh sách không gian làm việc..." />
      ) : workspaces.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '2.5rem' }}>🏫</span>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '0.75rem' }}>Chưa có không gian làm việc nào</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', marginBottom: '1rem' }}>
            Tạo không gian làm việc đầu tiên để bắt đầu tải tài liệu và soạn giáo án
          </p>
          <Button onClick={() => setIsCreating(true)}>Tạo không gian ngay</Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {workspaces.map((w) => (
            <WorkspaceCard
              key={w.id}
              workspace={w}
              isActive={activeWorkspace?.id === w.id}
              onSelect={setActiveWorkspace}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
