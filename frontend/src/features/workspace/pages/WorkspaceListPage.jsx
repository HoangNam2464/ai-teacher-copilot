import React, { useState, useEffect, useMemo } from 'react';
import { workspaceApi } from '../services/workspaceApi';
import { WorkspaceCard } from '../components/WorkspaceCard';
import { WorkspaceCreateEditModal } from '../components/WorkspaceCreateEditModal';
import { WorkspaceDeleteConfirmModal } from '../components/WorkspaceDeleteConfirmModal';
import { useWorkspace } from '../../../core/hooks/useWorkspace';
import { Button } from '../../../core/components/ui/Button';
import { Badge } from '../../../core/components/ui/Badge';
import { Spinner } from '../../../core/components/ui/Spinner';
import { EmptyState } from '../../../core/components/feedback/EmptyState';
import {
  IconSchool,
  IconPlus,
  IconSearch,
  IconCheckCircle,
  IconBookOpen,
} from '../../../core/components/icons/SvgIcons';

export function WorkspaceListPage() {
  const { workspaces, activeWorkspace, setWorkspaces, setActiveWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState(null);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await workspaceApi.getWorkspaces();
      setWorkspaces(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  // Distinct subjects for filter
  const distinctSubjects = useMemo(() => {
    const subjects = new Set();
    workspaces.forEach((w) => {
      if (w.subject && w.subject.trim()) {
        subjects.add(w.subject.trim());
      }
    });
    return Array.from(subjects);
  }, [workspaces]);

  // Client-side search and filtering
  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter((w) => {
      const matchesSearch = !searchQuery.trim() ||
        (w.name || '').toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        (w.description || '').toLowerCase().includes(searchQuery.trim().toLowerCase());

      const matchesSubject = subjectFilter === 'ALL' || (w.subject || '').trim() === subjectFilter;

      return matchesSearch && matchesSubject;
    });
  }, [workspaces, searchQuery, subjectFilter]);

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingWorkspace(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (workspace) => {
    setEditingWorkspace(workspace);
    setIsModalOpen(true);
  };

  const handleCreateOrUpdate = async (formData) => {
    try {
      setActionLoading(true);
      if (editingWorkspace) {
        const updated = await workspaceApi.updateWorkspace(editingWorkspace.id, formData);
        const updatedData = updated?.data || updated;

        const newWorkspaces = workspaces.map((w) =>
          w.id === editingWorkspace.id ? { ...w, ...formData, ...updatedData } : w
        );
        setWorkspaces(newWorkspaces);

        if (activeWorkspace?.id === editingWorkspace.id) {
          setActiveWorkspace({ ...activeWorkspace, ...formData, ...updatedData });
        }
      } else {
        const created = await workspaceApi.createWorkspace(formData);
        const createdData = created?.data || created;
        await loadWorkspaces();

        if (createdData && createdData.id) {
          setActiveWorkspace(createdData);
        }
      }
      setIsModalOpen(false);
      setEditingWorkspace(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingWorkspace) return;
    try {
      setActionLoading(true);
      await workspaceApi.deleteWorkspace(deletingWorkspace.id);

      const remaining = workspaces.filter((w) => w.id !== deletingWorkspace.id);
      setWorkspaces(remaining);

      if (activeWorkspace?.id === deletingWorkspace.id) {
        setActiveWorkspace(remaining[0] || null);
      }

      setDeletingWorkspace(null);
    } catch (err) {
      console.error('Failed to delete workspace:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Quản Lý Không Gian Làm Việc
            </h1>
            <Badge variant="primary">Context Isolation</Badge>
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Tổ chức và phân nhóm tài liệu, giáo án và đề thi theo từng môn học và khối lớp giảng dạy.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreateModal}
          icon={<IconPlus size={16} />}
        >
          Tạo không gian mới
        </Button>
      </div>

      {/* 2. Workspace Metrics Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
            <IconSchool size={20} />
          </span>
          <div>
            <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
              Tổng số không gian
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
              {workspaces.length} không gian làm việc
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <span style={{ color: 'var(--color-success)', display: 'flex' }}>
            <IconCheckCircle size={20} />
          </span>
          <div>
            <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
              Không gian đang kích hoạt
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
              {activeWorkspace ? `${activeWorkspace.name} (${activeWorkspace.subject || 'Chung'})` : 'Chưa chọn'}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
            <IconBookOpen size={20} />
          </span>
          <div>
            <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
              Môn học giảng dạy
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
              {distinctSubjects.length} môn học khác nhau
            </div>
          </div>
        </div>
      </div>

      {/* 3. Toolbar: Search, Subject Filter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--color-bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            Danh Sách Không Gian
          </span>
          <Badge variant="neutral">
            {filteredWorkspaces.length} / {workspaces.length}
          </Badge>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '200px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex' }}>
              <IconSearch size={14} />
            </span>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '30px', paddingRight: '12px', fontSize: 'var(--font-size-xs)', height: '32px' }}
              placeholder="Tìm theo tên hoặc mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Subject Filter */}
          {distinctSubjects.length > 0 && (
            <select
              className="form-select"
              style={{ padding: '0 var(--space-2-5)', fontSize: 'var(--font-size-xs)', height: '32px', width: 'auto' }}
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="ALL">Tất cả môn học ({workspaces.length})</option>
              {distinctSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  Môn: {sub}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 4. Content Area: Grid / Loading / Empty */}
      {loading && workspaces.length === 0 ? (
        <div style={{ padding: 'var(--space-12)', display: 'flex', justifyContent: 'center' }}>
          <Spinner message="Đang tải danh sách không gian làm việc..." size="md" />
        </div>
      ) : workspaces.length === 0 ? (
        <div style={{ padding: 'var(--space-8) var(--space-4)' }}>
          <EmptyState
            icon={IconSchool}
            title="Chưa Có Không Gian Làm Việc Nào"
            description="Tạo không gian làm việc đầu tiên để bắt đầu nạp tài liệu học liệu, soạn giáo án và tạo đề thi theo môn học."
            action={
              <Button variant="primary" onClick={handleOpenCreateModal} icon={<IconPlus size={16} />}>
                Tạo không gian ngay
              </Button>
            }
          />
        </div>
      ) : filteredWorkspaces.length === 0 ? (
        <div style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
            Không tìm thấy không gian làm việc nào khớp với từ khóa "{searchQuery}" hoặc bộ lọc đã chọn.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {filteredWorkspaces.map((w) => (
            <WorkspaceCard
              key={w.id}
              workspace={w}
              isActive={activeWorkspace?.id === w.id}
              onSelect={setActiveWorkspace}
              onEdit={handleOpenEditModal}
              onDelete={(ws) => setDeletingWorkspace(ws)}
            />
          ))}
        </div>
      )}

      {/* 5. Create / Edit Modal */}
      <WorkspaceCreateEditModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingWorkspace(null);
        }}
        onSubmit={handleCreateOrUpdate}
        workspace={editingWorkspace}
        loading={actionLoading}
      />

      {/* 6. Soft-Delete Confirmation Modal */}
      <WorkspaceDeleteConfirmModal
        isOpen={Boolean(deletingWorkspace)}
        onClose={() => setDeletingWorkspace(null)}
        onConfirm={handleDeleteConfirm}
        workspace={deletingWorkspace}
        loading={actionLoading}
      />
    </div>
  );
}
