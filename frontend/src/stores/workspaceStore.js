import { create } from 'zustand';
import { workspaceService } from '@/services/workspace';

/**
 * Workspace Store (Zustand)
 * Manages active workspace context, workspace list, caching, and optimistic mutations.
 */
export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  currentUserId: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  reset: () => {
    localStorage.removeItem('active_workspace_id');
    set({
      workspaces: [],
      activeWorkspace: null,
      currentUserId: null,
      isLoading: false,
      isInitialized: false,
      error: null,
    });
  },

  fetchWorkspaces: async (force = false) => {
    let authUserId = null;
    try {
      const stored = JSON.parse(localStorage.getItem('user') || 'null');
      authUserId = stored?.id || stored?.email || null;
    } catch {
      authUserId = null;
    }

    const { isInitialized, workspaces, currentUserId } = get();
    const userChanged = Boolean(authUserId && currentUserId && currentUserId !== authUserId);

    // Cache-first: if already loaded for the same user and not forced, return immediately
    if (isInitialized && !userChanged && workspaces.length > 0 && !force) {
      return workspaces;
    }

    if (!isInitialized || userChanged) {
      set({ isLoading: true, error: null });
    }

    try {
      const data = await workspaceService.getWorkspaces();
      const list = Array.isArray(data) ? data : data?.data || [];
      
      const savedId = localStorage.getItem('active_workspace_id');
      const matched = list.find((w) => w.id === savedId);
      const active = matched || list[0] || null;

      if (active) {
        localStorage.setItem('active_workspace_id', active.id);
      } else {
        localStorage.removeItem('active_workspace_id');
      }

      set({
        workspaces: list,
        activeWorkspace: active,
        currentUserId: authUserId,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
      return list;
    } catch (error) {
      console.warn('Failed to fetch workspaces:', error?.message);
      set({
        isLoading: false,
        isInitialized: true,
        error: error?.message || 'Failed to fetch workspaces',
      });
      return get().workspaces;
    }
  },

  setWorkspaces: (workspaces) => {
    const list = Array.isArray(workspaces) ? workspaces : [];
    const savedId = localStorage.getItem('active_workspace_id');
    const matched = list.find((w) => w.id === savedId);
    const active = matched || list[0] || null;

    if (active) {
      localStorage.setItem('active_workspace_id', active.id);
    } else {
      localStorage.removeItem('active_workspace_id');
    }

    set({ workspaces: list, activeWorkspace: active, isInitialized: true });
  },

  setActiveWorkspace: (workspace) => {
    if (workspace) {
      localStorage.setItem('active_workspace_id', workspace.id);
    } else {
      localStorage.removeItem('active_workspace_id');
    }
    set({ activeWorkspace: workspace });
  },

  createWorkspace: async (data) => {
    set({ isLoading: true });
    try {
      const created = await workspaceService.createWorkspace(data);
      const currentList = get().workspaces;
      const updatedList = [created, ...currentList];
      
      // If this is the only workspace, auto-activate it
      const active = get().activeWorkspace || created;
      if (active) {
        localStorage.setItem('active_workspace_id', active.id);
      }

      set({
        workspaces: updatedList,
        activeWorkspace: active,
        isLoading: false,
      });
      return created;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateWorkspace: async (id, data) => {
    set({ isLoading: true });
    try {
      const updated = await workspaceService.updateWorkspace(id, data);
      set((state) => ({
        workspaces: state.workspaces.map((w) => (w.id === id ? { ...w, ...updated } : w)),
        activeWorkspace: state.activeWorkspace?.id === id ? { ...state.activeWorkspace, ...updated } : state.activeWorkspace,
        isLoading: false,
      }));
      return updated;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteWorkspace: async (id) => {
    set({ isLoading: true });
    try {
      await workspaceService.deleteWorkspace(id);
      const filtered = get().workspaces.filter((w) => w.id !== id);
      const currentActive = get().activeWorkspace;
      let newActive = currentActive;

      if (currentActive?.id === id) {
        newActive = filtered[0] || null;
        if (newActive) {
          localStorage.setItem('active_workspace_id', newActive.id);
        } else {
          localStorage.removeItem('active_workspace_id');
        }
      }

      set({
        workspaces: filtered,
        activeWorkspace: newActive,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
