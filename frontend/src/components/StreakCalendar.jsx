import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function StreakCalendar({ activeDays = new Set() }) {
  const { t } = useTranslation();

  const DAY_NAMES = [
    t('streakCalendar.days.sun', 'CN'),
    t('streakCalendar.days.mon', 'T2'),
    t('streakCalendar.days.tue', 'T3'),
    t('streakCalendar.days.wed', 'T4'),
    t('streakCalendar.days.thu', 'T5'),
    t('streakCalendar.days.fri', 'T6'),
    t('streakCalendar.days.sat', 'T7'),
  ];
  const MONTH_NAMES = [
    t('streakCalendar.months.january', 'Tháng 1'),
    t('streakCalendar.months.february', 'Tháng 2'),
    t('streakCalendar.months.march', 'Tháng 3'),
    t('streakCalendar.months.april', 'Tháng 4'),
    t('streakCalendar.months.may', 'Tháng 5'),
    t('streakCalendar.months.june', 'Tháng 6'),
    t('streakCalendar.months.july', 'Tháng 7'),
    t('streakCalendar.months.august', 'Tháng 8'),
    t('streakCalendar.months.september', 'Tháng 9'),
    t('streakCalendar.months.october', 'Tháng 10'),
    t('streakCalendar.months.november', 'Tháng 11'),
    t('streakCalendar.months.december', 'Tháng 12'),
  ];
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const { days, firstDayOffset } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysList = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return { days: daysList, firstDayOffset: firstDay };
  }, [year, month]);

  const goBack = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else setMonth(month - 1);
  };

  const goForward = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else setMonth(month + 1);
  };

  const todayStr = today.toISOString().split('T')[0];

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goBack}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h4 className="text-sm font-semibold text-foreground">
          {MONTH_NAMES[month]} {year}
        </h4>
        <button
          type="button"
          onClick={goForward}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-medium text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(
            2,
            '0'
          )}`;
          const isActive = activeDays.has ? activeDays.has(dateStr) : false;
          const isToday = dateStr === todayStr;

          return (
            <div
              key={day}
              className={`relative flex items-center justify-center h-9 rounded-lg text-xs transition-colors ${
                isActive
                  ? 'bg-green-500/15 text-green-600 dark:text-green-400 font-semibold'
                  : 'text-muted-foreground hover:bg-muted/50'
              } ${isToday ? 'ring-2 ring-green-500/40 font-bold' : ''}`}
            >
              {day}
              {isActive && (
                <Flame className="absolute -top-1 -right-0.5 w-3 h-3 text-orange-500 fill-orange-500" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StreakCalendar;
