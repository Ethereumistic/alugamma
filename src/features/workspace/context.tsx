import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const SELECTED_ORG_KEY = "alugamma:selected-organization";
const SELECTED_PROJECT_KEY = "alugamma:selected-project";

export type WorkspaceViewer = {
  id: Id<"users">;
  email: string;
  name: string;
};

export type OrganizationSummary = {
  id: Id<"organizations">;
  name: string;
  slug: string;
  role: string;
  memberCount: number;
  projectCount: number;
};

export type ProjectDesignSummary = {
  id: Id<"designs">;
  name: string;
  exportName: string;
  updatedAt: number;
};

export type ProjectSummary = {
  id: Id<"projects">;
  organizationId: Id<"organizations">;
  organizationName: string;
  name: string;
  slug: string;
  description: string;
  role: string;
  designs: ProjectDesignSummary[];
};

export type PendingInviteSummary = {
  id: Id<"projectInvites">;
  organizationId: Id<"organizations">;
  organizationName: string;
  projectId: Id<"projects">;
  projectName: string;
  role: string;
  createdAt: number;
  expiresAt: number;
};

type ViewerWorkspace = {
  authenticated: boolean;
  viewer: WorkspaceViewer | null;
  organizations: OrganizationSummary[];
  projects: ProjectSummary[];
  pendingInvites: PendingInviteSummary[];
};

type WorkspaceContextValue = {
  workspace: ViewerWorkspace | undefined;
  isLoadingWorkspace: boolean;
  authenticated: boolean;
  viewer: WorkspaceViewer | null;
  organizations: OrganizationSummary[];
  projects: ProjectSummary[];
  pendingInvites: PendingInviteSummary[];
  selectedOrganizationId: Id<"organizations"> | null;
  setSelectedOrganizationId: (organizationId: Id<"organizations"> | null) => void;
  selectedProjectId: Id<"projects"> | null;
  setSelectedProjectId: (projectId: Id<"projects"> | null) => void;
  selectedOrganization: OrganizationSummary | null;
  selectedProject: ProjectSummary | null;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function readStoredId(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key);
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const workspace = useQuery(api.workspaces.viewerWorkspace, {}) as ViewerWorkspace | undefined;
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<Id<"organizations"> | null>(
    () => readStoredId(SELECTED_ORG_KEY) as Id<"organizations"> | null,
  );
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(
    () => readStoredId(SELECTED_PROJECT_KEY) as Id<"projects"> | null,
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (selectedOrganizationId) {
      window.localStorage.setItem(SELECTED_ORG_KEY, selectedOrganizationId);
    } else {
      window.localStorage.removeItem(SELECTED_ORG_KEY);
    }
  }, [selectedOrganizationId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (selectedProjectId) {
      window.localStorage.setItem(SELECTED_PROJECT_KEY, selectedProjectId);
    } else {
      window.localStorage.removeItem(SELECTED_PROJECT_KEY);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (!workspace) {
      return;
    }

    if (!workspace.authenticated) {
      setSelectedOrganizationId(null);
      setSelectedProjectId(null);
      return;
    }

    const hasSelectedProject = selectedProjectId
      ? workspace.projects.some((project) => project.id === selectedProjectId)
      : false;
    const nextProjectId = hasSelectedProject ? selectedProjectId : (workspace.projects[0]?.id ?? null);

    if (nextProjectId !== selectedProjectId) {
      setSelectedProjectId(nextProjectId);
    }

    const nextOrganizationId =
      workspace.projects.find((project) => project.id === nextProjectId)?.organizationId ??
      (selectedOrganizationId && workspace.organizations.some((organization) => organization.id === selectedOrganizationId)
        ? selectedOrganizationId
        : (workspace.organizations[0]?.id ?? null));

    if (nextOrganizationId !== selectedOrganizationId) {
      setSelectedOrganizationId(nextOrganizationId);
    }
  }, [workspace, selectedOrganizationId, selectedProjectId]);

  const selectedProject = workspace?.projects.find((project) => project.id === selectedProjectId) ?? null;
  const selectedOrganization =
    workspace?.organizations.find((organization) => organization.id === (selectedProject?.organizationId ?? selectedOrganizationId)) ??
    null;

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        isLoadingWorkspace: workspace === undefined,
        authenticated: workspace?.authenticated ?? false,
        viewer: workspace?.viewer ?? null,
        organizations: workspace?.organizations ?? [],
        projects: workspace?.projects ?? [],
        pendingInvites: workspace?.pendingInvites ?? [],
        selectedOrganizationId,
        setSelectedOrganizationId,
        selectedProjectId,
        setSelectedProjectId,
        selectedOrganization,
        selectedProject,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }

  return context;
}
