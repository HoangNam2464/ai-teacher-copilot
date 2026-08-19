import { create } from 'zustand';

/**
 * Workspace Store (Zustand)
 * Manages active workspace context, workspace list, and selection.
 */
export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  isLoading: false,

  setWorkspaces: (workspaces) => {
    const savedId = localStorage.getItem('active_workspace_id');
    const matched = workspaces.find((w) => w.id === savedId);
    const active = matched || workspaces[0] || null;

    if (active) {
      localStorage.setItem('active_workspace_id', active.id);
    }

    set({ workspaces, activeWorkspace: active });
  },

  setActiveWorkspace: (workspace) => {
    if (workspace) {
      localStorage.setItem('active_workspace_id', workspace.id);
    }
    set({ activeWorkspace: workspace });
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
