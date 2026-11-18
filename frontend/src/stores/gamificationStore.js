import { create } from 'zustand';

export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];

export const LEVEL_NAMES = [
  { name: 'Khởi đầu', gradient: 'from-gray-400 to-gray-500', shadow: 'shadow-gray-400/20', text: 'text-gray-500' },
  { name: 'Đồng hành', gradient: 'from-amber-600 to-amber-700', shadow: 'shadow-amber-600/20', text: 'text-amber-600' },
  { name: 'Tích cực', gradient: 'from-slate-400 to-slate-500', shadow: 'shadow-slate-400/20', text: 'text-slate-500' },
  { name: 'Sáng tạo', gradient: 'from-yellow-400 to-yellow-500', shadow: 'shadow-yellow-400/20', text: 'text-yellow-500' },
  { name: 'Chuyên gia', gradient: 'from-cyan-400 to-cyan-500', shadow: 'shadow-cyan-400/20', text: 'text-cyan-500' },
  { name: 'Tiên phong AI', gradient: 'from-blue-400 to-blue-500', shadow: 'shadow-blue-400/20', text: 'text-blue-500' },
  { name: 'Sư phạm Xuất sắc', gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/20', text: 'text-purple-500' },
  { name: 'Nhà giáo Ưu tú', gradient: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/20', text: 'text-red-500' },
  { name: 'Thầy cô Đổi mới', gradient: 'from-orange-500 to-red-500', shadow: 'shadow-orange-500/20', text: 'text-orange-500' },
  { name: 'Huyền thoại', gradient: 'from-indigo-500 to-violet-600', shadow: 'shadow-indigo-500/20', text: 'text-indigo-500' },
  { name: 'Kỳ cựu', gradient: 'from-fuchsia-500 to-pink-600', shadow: 'shadow-fuchsia-500/20', text: 'text-fuchsia-500' },
  { name: 'Bậc thầy Sư phạm', gradient: 'from-amber-400 via-red-500 to-purple-600', shadow: 'shadow-amber-400/20', text: 'text-amber-500' },
];

export function getLevelInfo(level) {
  return LEVEL_NAMES[Math.min(Math.max(0, level), LEVEL_NAMES.length - 1)];
}

export function getLevelFromXP(xp) {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }
  const currentLevelXp = LEVEL_THRESHOLDS[level] || 0;
  const nextLevelXp = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[level] + 2500;
  return { level, currentLevelXp, nextLevelXp };
}

export const useGamificationStore = create((set, get) => ({
  stats: {
    totalXp: 180,
    level: 1,
    streakDays: 5,
    dailyXp: 75,
    dailyGoal: 100,
    currentLevelXp: 100,
    nextLevelXp: 300,
  },
  recentXpGain: null,
  isLoading: false,

  fetchGamification: async () => {
    // In local demo or when API is not present, maintain realistic state
    const saved = localStorage.getItem('gamification_xp');
    const xp = saved ? parseInt(saved, 10) : 180;
    const { level, currentLevelXp, nextLevelXp } = getLevelFromXP(xp);
    set({
      stats: {
        totalXp: xp,
        level,
        streakDays: 5,
        dailyXp: 75,
        dailyGoal: 100,
        currentLevelXp,
        nextLevelXp,
      },
      isLoading: false,
    });
  },

  addXP: (amount = 25) => {
    const current = get().stats;
    const newTotal = (current?.totalXp || 0) + amount;
    const { level, currentLevelXp, nextLevelXp } = getLevelFromXP(newTotal);
    localStorage.setItem('gamification_xp', newTotal.toString());
    set({
      stats: {
        ...current,
        totalXp: newTotal,
        dailyXp: (current?.dailyXp || 0) + amount,
        level,
        currentLevelXp,
        nextLevelXp,
      },
      recentXpGain: amount,
    });
  },

  clearRecentXp: () => set({ recentXpGain: null }),
}));
