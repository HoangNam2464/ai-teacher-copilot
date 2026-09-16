import { create } from 'zustand';

export const useNotificationsStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  preferences: null,
  isLoading: false,
  isOpen: false,

  fetchNotifications: async (page = 1, limit = 20) => {
    set({ isLoading: true });
    try {
      // In MVP/dev, keep safe empty state or handle API
      set({
        notifications: [],
        total: 0,
        unreadCount: 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      set({ unreadCount: 0 });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  deleteNotification: (id) => {
    const notification = get().notifications.find((n) => n.id === id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      total: Math.max(0, state.total - 1),
      unreadCount: notification && !notification.isRead ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    }));
  },

  deleteAll: () => {
    set({ notifications: [], total: 0, unreadCount: 0 });
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      total: state.total + 1,
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
    }));
  },

  setOpen: (open) => set({ isOpen: open }),

  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
