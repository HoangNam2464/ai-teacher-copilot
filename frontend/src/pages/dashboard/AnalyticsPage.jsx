import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { XPProgressBar } from '@/components/XPProgressBar';
import { StudyHeatmap } from '@/components/StudyHeatmap';
import { StreakCalendar } from '@/components/StreakCalendar';
import { useGamificationStore } from '@/stores/gamificationStore';
import {
  Clock,
  BookOpen,
  FileQuestion,
  Target,
  TrendingUp,
} from 'lucide-react';

const STATUS_COLORS = {
  Recall: '#3b82f6',
  Understand: '#22c55e',
  Apply: '#f59e0b',
  Analyze: '#a855f7',
};

export function AnalyticsPage() {
  const { t } = useTranslation();
  const { fetchGamification } = useGamificationStore();
  const [dateRange, setDateRange] = useState('30d'); // '7d' | '30d' | '90d' | 'all'
  const [timeView, setTimeView] = useState('daily'); // 'daily' | 'weekly'

  useEffect(() => {
    fetchGamification();
  }, [fetchGamification]);

  // Mock activity data
  const activity = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 90; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hasActivity = (i % 3 === 0 || i % 7 === 0) && i !== 2;
      list.push({
        date: dateStr,
        sessions: hasActivity ? (i % 4) + 1 : 0,
        studyMinutes: hasActivity ? ((i % 5) + 1) * 25 : 0,
      });
    }
    return list;
  }, []);

  const heatmapData = useMemo(() => {
    const map = {};
    activity.forEach((a) => {
      map[a.date] = a.sessions;
    });
    return map;
  }, [activity]);

  const activeDaysSet = useMemo(() => {
    return new Set(activity.filter((a) => a.sessions > 0).map((a) => a.date));
  }, [activity]);

  const studyTimeData = useMemo(() => {
    if (timeView === 'weekly') {
      const weeksMap = {};
      activity.forEach((a) => {
        const d = new Date(a.date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toISOString().split('T')[0];
        weeksMap[key] = (weeksMap[key] || 0) + a.studyMinutes;
      });
      return Object.entries(weeksMap).slice(-8).map(([date, minutes]) => ({
        date: new Date(date).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' }),
        minutes,
      }));
    }
    return activity.slice(-14).map((a) => ({
      date: new Date(a.date).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' }),
      minutes: a.studyMinutes,
    }));
  }, [activity, timeView]);

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const bloomDistribution = [
    { name: 'Nhận biết (Recall)', key: 'Recall', count: 45, pct: 40 },
    { name: 'Thông hiểu (Understand)', key: 'Understand', count: 32, pct: 30 },
    { name: 'Vận dụng (Apply)', key: 'Apply', count: 22, pct: 20 },
    { name: 'Vận dụng cao (Analyze)', key: 'Analyze', count: 11, pct: 10 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('analytics.title', 'Thống Kê Giảng Dạy')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('analytics.subtitle', 'Theo dõi tiến trình soạn bài & hiệu suất hỗ trợ của AI Copilot')}
            </p>
          </div>

          {/* Date range selector */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 self-start sm:self-auto">
            {['7d', '30d', '90d', 'all'].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  dateRange === range
                    ? 'bg-background shadow-xs text-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(`analytics.dateRange.${range}`, range === '7d' ? '7 ngày' : range === '30d' ? '30 ngày' : range === '90d' ? '90 ngày' : 'Tất cả')}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* XP Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-xl p-5 shadow-xs"
      >
        <XPProgressBar />
      </motion.div>

      {/* Top stats row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{formatTime(750)}</p>
              <p className="text-xs text-muted-foreground">{t('analytics.studyTime', 'Thời gian tiết kiệm')}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xl font-bold">8</p>
              <p className="text-xs text-muted-foreground">{t('analytics.cardsReviewed', 'Tài liệu SGK nạp vào')}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <FileQuestion className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xl font-bold">16</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.stats.quizzesDone', 'Giáo án & Đề thi')}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-bold">98%</p>
              <p className="text-xs text-muted-foreground">{t('analytics.avgScore', 'Chuẩn hóa Bloom')}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Activity Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-xl p-5 shadow-xs"
      >
        <h3 className="font-medium text-sm mb-4">{t('analytics.studyTime', 'Tần suất hoạt động chuẩn bị bài')}</h3>
        <div className="overflow-x-auto">
          <StudyHeatmap
            data={heatmapData}
            weeks={dateRange === '7d' ? 8 : dateRange === '30d' ? 16 : dateRange === '90d' ? 26 : 52}
          />
        </div>
      </motion.div>

      {/* Charts row 1: Streak Calendar + Bloom Mastery Breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Streak Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-5 shadow-xs"
        >
          <h3 className="font-medium text-sm mb-4">{t('analytics.streak', 'Chuỗi ngày giảng dạy')}</h3>
          <StreakCalendar activeDays={activeDaysSet} />
        </motion.div>

        {/* Bloom Mastery Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between"
        >
          <div>
            <h3 className="font-medium text-sm mb-4">{t('analytics.cardMastery', 'Phân bổ Thang đo Bloom')}</h3>
            <div className="space-y-3.5">
              {bloomDistribution.map((entry) => (
                <div key={entry.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[entry.key] }}
                      />
                      <span className="font-medium text-foreground">{entry.name}</span>
                    </div>
                    <span className="text-muted-foreground font-semibold">
                      {entry.count} câu ({entry.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${entry.pct}%`,
                        backgroundColor: STATUS_COLORS[entry.key],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-border mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Tổng cộng: 110 câu hỏi</span>
            <span className="text-green-600 dark:text-green-400 font-semibold">Chuẩn ma trận Bộ GD ✓</span>
          </div>
        </motion.div>
      </div>

      {/* Charts row 2: Retention Curve + Study Time Bar Chart */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Retention / Grounding Curve */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <h3 className="font-medium text-sm">{t('analytics.retentionCurve', 'Độ bám sát ngữ liệu SGK')}</h3>
            </div>
            <div className="h-40 flex items-end justify-between gap-2 px-2 pt-6">
              {[
                { day: 'T2', pct: 92 },
                { day: 'T3', pct: 95 },
                { day: 'T4', pct: 89 },
                { day: 'T5', pct: 96 },
                { day: 'T6', pct: 98 },
                { day: 'T7', pct: 94 },
                { day: 'CN', pct: 97 },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-semibold text-muted-foreground">{item.pct}%</span>
                  <div className="w-full bg-muted rounded-t-md h-full relative flex items-end">
                    <div
                      className="w-full bg-emerald-500 rounded-t-md transition-all duration-500"
                      style={{ height: `${item.pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
            Trung bình 95.8% nội dung có trích dẫn xuất xứ trang SGK chính xác.
          </p>
        </motion.div>

        {/* Study Time Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm">{t('analytics.studyTime', 'Thời lượng tương tác AI')}</h3>
              <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                <button
                  type="button"
                  onClick={() => setTimeView('daily')}
                  className={`px-2 py-1 text-[10px] font-medium rounded-xs transition-colors ${
                    timeView === 'daily' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground'
                  }`}
                >
                  {t('analytics.daily', 'Hàng ngày')}
                </button>
                <button
                  type="button"
                  onClick={() => setTimeView('weekly')}
                  className={`px-2 py-1 text-[10px] font-medium rounded-xs transition-colors ${
                    timeView === 'weekly' ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground'
                  }`}
                >
                  {t('analytics.weekly', 'Hàng tuần')}
                </button>
              </div>
            </div>

            <div className="h-40 flex items-end justify-between gap-1.5 px-2 pt-6">
              {studyTimeData.map((item, idx) => {
                const maxMins = 120;
                const heightPct = Math.min(Math.round((item.minutes / maxMins) * 100), 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[9px] font-medium text-muted-foreground">{item.minutes}m</span>
                    <div className="w-full bg-muted rounded-t-md h-full relative flex items-end">
                      <div
                        className="w-full bg-green-500 rounded-t-md transition-all duration-500"
                        style={{ height: `${Math.max(heightPct, 8)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground truncate max-w-[32px]">{item.date}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
            Tối ưu hóa năng suất chuẩn bị bài giảng tăng 35% so với tháng trước.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
