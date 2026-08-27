import React, { useState, useEffect } from 'react';
import { historyApi } from '../services/historyApi';
import { useWorkspace } from '../../../core/hooks/useWorkspace';
import { Badge } from '../../../core/components/ui/Badge';
import { Spinner } from '../../../core/components/ui/Spinner';
import { ExportDropdown } from '../../../core/components/export/ExportDropdown';
import { formatDate } from '../../../core/utils/formatters';

export function HistoryListPage() {
  const { activeWorkspace } = useWorkspace();
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    if (!activeWorkspace?.id) return;
    try {
      setLoading(true);
      const data = await historyApi.getHistory(activeWorkspace.id);
      setHistoryItems(data || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [activeWorkspace?.id]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Đã duyệt</Badge>;
      case 'REVIEWED':
        return <Badge variant="info">Đã kiểm tra</Badge>;
      default:
        return <Badge variant="neutral">Bản nháp (DRAFT)</Badge>;
    }
  };

  if (!activeWorkspace) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Vui lòng chọn Không gian làm việc trước để xem lịch sử.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Lịch Sử Soạn Thảo & Bản Nháp</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          Quản lý các phiên bản giáo án và đề thi đã sinh cho không gian <strong>{activeWorkspace.name}</strong>
        </p>
      </div>

      <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Danh Sách Bài Soạn ({historyItems.length})</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadHistory}>
            🔄 Làm mới
          </button>
        </div>

        {loading ? (
          <Spinner message="Đang tải lịch sử bài soạn..." />
        ) : historyItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <span style={{ fontSize: '2.5rem' }}>🕒</span>
            <p style={{ marginTop: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Chưa có bài soạn hoặc đề thi nào được tạo trong không gian này.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>Tiêu đề / Chủ đề</th>
                <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>Loại</th>
                <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>Phiên bản</th>
                <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>Trạng thái</th>
                <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>Thời gian tạo</th>
                <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Xuất tài liệu</th>
              </tr>
            </thead>
            <tbody>
              {historyItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 1.25rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {item.contentType === 'LESSON_PLAN' ? '📝' : '🎯'} {item.title || 'Bài soạn không tên'}
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem', color: 'var(--color-text-secondary)' }}>
                    {item.contentType === 'LESSON_PLAN' ? 'Giáo án' : 'Đề thi / Quiz'}
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem' }}>
                    <Badge variant="neutral">v{item.version || 1}</Badge>
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem' }}>
                    {getStatusBadge(item.reviewStatus)}
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem', color: 'var(--color-text-secondary)' }}>
                    {formatDate(item.createdAt)}
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                    <ExportDropdown
                      workspaceId={activeWorkspace.id}
                      generationId={item.id}
                      defaultFileName={item.title || 'bai-soan'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
