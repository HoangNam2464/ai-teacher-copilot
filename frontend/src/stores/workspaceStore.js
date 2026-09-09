import { create } from 'zustand';
import { workspaceService } from '@/services/workspace';

/**
 * Workspace Store (Zustand)
 * Manages active workspace context, workspace list, caching, and optimistic mutations.
 */
export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  fetchWorkspaces: async (force = false) => {
    const { isInitialized, workspaces } = get();
    // Cache-first: if already loaded and not forced, return immediately
    if (isInitialized && workspaces.length > 0 && !force) {
      return workspaces;
    }

    if (!isInitialized) {
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
      }

      set({
        workspaces: list,
        activeWorkspace: active,
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
    }

    set({ workspaces: list, activeWorkspace: active, isInitialized: true });
  },

  setActiveWorkspace: (workspace) => {
    if (workspace) {
      localStorage.setItem('active_workspace_id', workspace.id);
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
