import React, { useState, useEffect, useMemo } from 'react';
import { historyApi } from '../services/historyApi';
import { HistoryRow } from '../components/HistoryRow';
import { HistoryDetailModal } from '../components/HistoryDetailModal';
import { useWorkspace } from '../../../core/hooks/useWorkspace';
import { Badge } from '../../../core/components/ui/Badge';
import { Button } from '../../../core/components/ui/Button';
import { Spinner } from '../../../core/components/ui/Spinner';
import { EmptyState } from '../../../core/components/feedback/EmptyState';
import {
    IconClock,
    IconFileText,
    IconTarget,
    IconSearch,
    IconRefresh,
    IconSchool,
    IconBookOpen,
} from '../../../core/components/icons/SvgIcons';

export function HistoryListPage() {
    const { activeWorkspace } = useWorkspace();
    const [historyItems, setHistoryItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [contentTypeFilter, setContentTypeFilter] = useState('ALL');
    const [reviewStatusFilter, setReviewStatusFilter] = useState('ALL');
    const [selectedItemForDetail, setSelectedItemForDetail] = useState(null);

    const loadHistory = async (isManualRefresh = false) => {
        if (!activeWorkspace?.id) return;
        try {
            if (isManualRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            const data = await historyApi.getHistory(activeWorkspace.id);
            setHistoryItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.warn('Failed to load history:', err);
            setHistoryItems([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [activeWorkspace?.id]);

    // Determine if reviewStatus exists in any items
    const availableStatuses = useMemo(() => {
        const statuses = new Set();
        historyItems.forEach((item) => {
            if (item.reviewStatus) {
                statuses.add(item.reviewStatus);
            }
        });
        return Array.from(statuses);
    }, [historyItems]);

    // Client-side filtering & search
    const filteredItems = useMemo(() => {
        return historyItems.filter((item) => {
            const q = searchQuery.trim().toLowerCase();
            const matchesSearch = !q ||
                (item.title || '').toLowerCase().includes(q) ||
                (item.topic || '').toLowerCase().includes(q) ||
                (item.subject || '').toLowerCase().includes(q);

            const matchesType = contentTypeFilter === 'ALL' || item.contentType === contentTypeFilter;
            const matchesStatus = reviewStatusFilter === 'ALL' || item.reviewStatus === reviewStatusFilter;

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [historyItems, searchQuery, contentTypeFilter, reviewStatusFilter]);

    // Derived metrics from actual data
    const metrics = useMemo(() => {
        let lessonCount = 0;
        let quizCount = 0;
        let approvedCount = 0;

        historyItems.forEach((item) => {
            if (item.contentType === 'LESSON_PLAN') lessonCount++;
            if (item.contentType === 'QUIZ') quizCount++;
            if (item.reviewStatus === 'APPROVED') approvedCount++;
        });

        return {
            total: historyItems.length,
            lessonPlans: lessonCount,
            quizzes: quizCount,
            approved: approvedCount,
        };
    }, [historyItems]);

    if (!activeWorkspace) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-4)' }}>
                <EmptyState
                    icon={IconSchool}
                    title="Chưa Chọn Không Gian Làm Việc"
                    description="Vui lòng chọn một Không gian làm việc từ menu để tra cứu lịch sử bài soạn và đề thi."
                />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* 1. Page Header */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                        Lịch Sử Soạn Thảo & Đánh Giá Bài Soạn
                    </h1>
                    <Badge variant="primary">History & Review</Badge>
                </div>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Quản lý các phiên bản giáo án và đề thi đã sinh cho không gian làm việc <strong>{activeWorkspace.name}</strong>.
                </p>
            </div>

            {/* 2. Workspace Context & History Metrics Ribbon */}
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
                        <IconClock size={20} />
                    </span>
                    <div>
                        <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
                            Tổng số bài soạn
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                            {metrics.total} bản ghi lưu trữ
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
                        <IconFileText size={20} />
                    </span>
                    <div>
                        <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
                            Giáo án đã sinh
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                            {metrics.lessonPlans} giáo án
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
                    <span style={{ color: '#7C3AED', display: 'flex' }}>
                        <IconTarget size={20} />
                    </span>
                    <div>
                        <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
                            Đề thi / Quiz đã sinh
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                            {metrics.quizzes} bộ đề
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. History Table Container Card */}
            <div
                style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-xs)',
                }}
            >
                {/* Toolbar: Search, Type Filter, Status Filter & Refresh */}
                <div
                    style={{
                        padding: 'var(--space-3) var(--space-4)',
                        borderBottom: '1px solid var(--color-border)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        backgroundColor: 'var(--color-bg-subtle)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', margin: 0 }}>
                            Danh Sách Bài Soạn
                        </h3>
                        <Badge variant="neutral">
                            {filteredItems.length} bản ghi
                        </Badge>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        {/* Search Input */}
                        <div style={{ position: 'relative', minWidth: '180px' }}>
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex' }}>
                                <IconSearch size={14} />
                            </span>
                            <input
                                type="text"
                                className="form-input"
                                style={{ paddingLeft: '30px', paddingRight: '12px', fontSize: 'var(--font-size-xs)', height: '32px' }}
                                placeholder="Tìm tiêu đề, chủ đề..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Content Type Filter */}
                        <select
                            className="form-select"
                            style={{ padding: '0 var(--space-2-5)', fontSize: 'var(--font-size-xs)', height: '32px', width: 'auto' }}
                            value={contentTypeFilter}
                            onChange={(e) => setContentTypeFilter(e.target.value)}
                        >
                            <option value="ALL">Tất cả loại bài</option>
                            <option value="LESSON_PLAN">Giáo án (Lesson Plan)</option>
                            <option value="QUIZ">Đề thi (Quiz)</option>
                        </select>

                        {/* Review Status Filter (only if statuses exist) */}
                        {availableStatuses.length > 0 && (
                            <select
                                className="form-select"
                                style={{ padding: '0 var(--space-2-5)', fontSize: 'var(--font-size-xs)', height: '32px', width: 'auto' }}
                                value={reviewStatusFilter}
                                onChange={(e) => setReviewStatusFilter(e.target.value)}
                            >
                                <option value="ALL">Tất cả trạng thái</option>
                                {availableStatuses.map((st) => (
                                    <option key={st} value={st}>
                                        {st === 'APPROVED' ? 'Đã duyệt' : st === 'REVIEWED' ? 'Đã kiểm tra' : st === 'DRAFT' ? 'Bản nháp' : st}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Refresh Button */}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => loadHistory(true)}
                            loading={refreshing}
                            disabled={refreshing || loading}
                            icon={<IconRefresh size={14} />}
                            title="Làm mới danh sách lịch sử bài soạn"
                        >
                            <span>Làm mới</span>
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div style={{ padding: 'var(--space-10)', display: 'flex', justifyContent: 'center' }}>
                        <Spinner message="Đang tải lịch sử bài soạn..." size="md" />
                    </div>
                ) : historyItems.length === 0 ? (
                    <div style={{ padding: 'var(--space-10) var(--space-4)' }}>
                        <EmptyState
                            icon={IconClock}
                            title="Chưa Có Lịch Sử Bài Soạn Trong Không Gian Này"
                            description="Các bài soạn giáo án và đề thi sau khi được lưu trữ trên hệ thống sẽ xuất hiện tại đây để Thầy/Cô tra cứu, xem lại và xuất bản."
                        />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center' }}>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                            Không tìm thấy bài soạn nào khớp với từ khóa "{searchQuery}" hoặc bộ lọc đã chọn.
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                                    <th style={{ padding: 'var(--space-2-5) var(--space-4)', fontSize: 'var(--font-size-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Tiêu đề / Chủ đề
                                    </th>
                                    <th style={{ padding: 'var(--space-2-5) var(--space-4)', fontSize: 'var(--font-size-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Loại bài
                                    </th>
                                    <th style={{ padding: 'var(--space-2-5) var(--space-4)', fontSize: 'var(--font-size-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Phiên bản
                                    </th>
                                    <th style={{ padding: 'var(--space-2-5) var(--space-4)', fontSize: 'var(--font-size-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Trạng thái
                                    </th>
                                    <th style={{ padding: 'var(--space-2-5) var(--space-4)', fontSize: 'var(--font-size-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Ngày tạo
                                    </th>
                                    <th style={{ padding: 'var(--space-2-5) var(--space-4)', fontSize: 'var(--font-size-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                                        Thao tác & Xuất
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((item) => (
                                    <HistoryRow
                                        key={item.id}
                                        item={item}
                                        workspaceId={activeWorkspace.id}
                                        onViewDetail={(record) => setSelectedItemForDetail(record)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 4. History Detail Modal */}
            <HistoryDetailModal
                isOpen={Boolean(selectedItemForDetail)}
                onClose={() => setSelectedItemForDetail(null)}
                item={selectedItemForDetail}
            />
        </div>
    );
}
