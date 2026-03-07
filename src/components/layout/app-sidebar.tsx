import { ChevronDown, ChevronRight, FileStack, FolderKanban, LayoutDashboard, LogOut, Plus, ScissorsLineDashed, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useSheetMetal } from "@/features/sheet-metal/context";
import { useWorkspace } from "@/features/workspace/context";

const navItems = [
  {
    title: "Workspace",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Sheet Metal",
    url: "/sheet-metal",
    icon: ScissorsLineDashed,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut } = useAuthActions();
  const { viewer, authenticated, projects, selectedProjectId, setSelectedOrganizationId, setSelectedProjectId } = useWorkspace();
  const { startNewDesign } = useSheetMetal();
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});

  const pathIsSheetMetal = location.pathname.startsWith("/sheet-metal");

  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }

    setOpenProjects((current) => ({ ...current, [selectedProjectId]: true }));
  }, [selectedProjectId]);

  function toggleProject(projectId: string) {
    setOpenProjects((current) => ({ ...current, [projectId]: !current[projectId] }));
  }

  return (
    <Sidebar className="border-r border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(9,13,22,0.98))]">
      <SidebarHeader className="border-b border-white/5 px-6 py-5">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-primary shadow-[0_0_18px_rgba(20,180,100,0.14)]">
            <ScissorsLineDashed className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display text-lg font-semibold tracking-tight text-white">AluGamma</span>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">DXF Workspace</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="overflow-hidden">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Internal Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.url === "/sheet-metal" ? pathIsSheetMetal : location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      }
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {authenticated && (
          <SidebarGroup className="min-h-0 flex-1 overflow-hidden">
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Saved Designs
            </SidebarGroupLabel>
            <SidebarGroupContent className="min-h-0 overflow-hidden">
              <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-white transition-colors hover:bg-white/5"
                  onClick={() => setProjectsExpanded((current) => !current)}
                >
                  <span className="inline-flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-emerald-300" />
                    Projects
                  </span>
                  {projectsExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </button>

                {projectsExpanded && (
                  <SidebarMenuSub className="mt-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                    {projects.map((project) => {
                      const isOpen = openProjects[project.id] ?? project.id === selectedProjectId;
                      return (
                        <SidebarMenuSubItem key={project.id} className="rounded-xl border border-transparent bg-black/10 px-1 py-1">
                          <div>
                            <button
                              type="button"
                              onClick={() => toggleProject(project.id)}
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                project.id === selectedProjectId ? "bg-primary/12 text-white" : "text-slate-300 hover:bg-white/5"
                              }`}
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-medium">{project.name}</span>
                                <span className="block truncate text-[11px] uppercase tracking-[0.22em] text-slate-500">{project.designs.length} designs</span>
                              </span>
                              {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />}
                            </button>

                            {isOpen && (
                              <div className="ml-3 mt-2 border-l border-white/8 pl-3">
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={location.pathname === "/sheet-metal" && project.id === selectedProjectId}
                                  className="mb-1 text-slate-300 hover:text-white"
                                >
                                  <Link
                                    to="/sheet-metal"
                                    onClick={() => {
                                      setSelectedOrganizationId(project.organizationId);
                                      setSelectedProjectId(project.id);
                                      startNewDesign();
                                    }}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>New draft</span>
                                  </Link>
                                </SidebarMenuSubButton>

                                {project.designs.length === 0 ? (
                                  <div className="rounded-lg border border-dashed border-white/8 px-3 py-2 text-xs text-slate-500">
                                    No saved designs yet.
                                  </div>
                                ) : (
                                  project.designs.map((design) => (
                                    <SidebarMenuSubButton
                                      key={design.id}
                                      asChild
                                      isActive={location.pathname === `/sheet-metal/${design.id}`}
                                      className="text-slate-300 hover:text-white"
                                    >
                                      <Link
                                        to={`/sheet-metal/${design.id}`}
                                        onClick={() => {
                                          setSelectedOrganizationId(project.organizationId);
                                          setSelectedProjectId(project.id);
                                        }}
                                      >
                                        <FileStack className="h-3.5 w-3.5" />
                                        <span className="truncate">{design.name}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/6 bg-black/20 px-4 py-4">
        {authenticated && viewer ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/20 text-slate-300">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{viewer.name || viewer.email}</p>
                  <p className="truncate text-xs text-slate-500">{viewer.email}</p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start border-white/10 bg-black/20 text-slate-300 hover:bg-white/5 hover:text-white"
              onClick={() => void signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        ) : (
          <Button asChild className="w-full justify-start">
            <Link to="/auth">Sign in</Link>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
