import { useWorkspaceStore } from '../store/workspaceStore';

export function useWorkspace() {
  const { workspaces, activeWorkspace, isLoading, setWorkspaces, setActiveWorkspace, setLoading } =
    useWorkspaceStore();

  return {
    workspaces,
    activeWorkspace,
    activeWorkspaceId: activeWorkspace?.id || null,
    isLoading,
    setWorkspaces,
    setActiveWorkspace,
    setLoading,
  };
}
