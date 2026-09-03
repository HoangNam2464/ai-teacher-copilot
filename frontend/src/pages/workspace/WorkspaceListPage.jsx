import React, { useState, useEffect } from 'react';
import { workspaceApi } from '@/services/workspace/workspaceApi';
import { WorkspaceCard } from '@/components/workspace/WorkspaceCard';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>Không Gian Làm Việc</h1>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem' }}>
            Quản lý và phân nhóm tài liệu giảng dạy theo lớp và môn học
          </p>
        </div>
        <button className={isCreating ? 'btn btn-outline' : 'btn btn-primary'} onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Hủy bỏ' : '+ Tạo không gian mới'}
        </button>
      </div>

      {isCreating && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.25rem' }}>Tạo Không Gian Giảng Dạy Mới</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Tên không gian <span className="form-required">*</span></label>
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
            <button type="submit" className="btn btn-primary">Lưu không gian làm việc</button>
          </form>
        </div>
      )}

      {loading && workspaces.length === 0 ? (
        <Spinner message="Đang tải danh sách không gian làm việc..." />
      ) : workspaces.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'hsl(var(--muted)/0.3)' }}>
          <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>🏫</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Chưa có không gian làm việc nào</h3>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            Tạo không gian làm việc đầu tiên để bắt đầu tải tài liệu và soạn giáo án
          </p>
          <button className="btn btn-primary" onClick={() => setIsCreating(true)}>Tạo không gian ngay</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
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
