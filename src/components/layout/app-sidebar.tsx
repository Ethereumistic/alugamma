import { ChevronDown, FileStack, LayoutDashboard, LogOut, Plus, ScissorsLineDashed, UserRound } from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSheetMetal } from "@/features/sheet-metal/context";
import { useWorkspace } from "@/features/workspace/context";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const { viewer, authenticated, organizations, projects, selectedOrganizationId, selectedProjectId, setSelectedOrganizationId, setSelectedProjectId, selectedOrganization, selectedProject } = useWorkspace();
  const { startNewDesign } = useSheetMetal();

  const pathIsSheetMetal = location.pathname.startsWith("/sheet-metal");

  const organizationProjects = useMemo(() => {
    if (!selectedOrganizationId) return [];
    return projects.filter((project) => project.organizationId === selectedOrganizationId);
  }, [projects, selectedOrganizationId]);

  function handleOrganizationChange(orgId: string) {
    setSelectedOrganizationId(orgId as any);
    const orgProjects = projects.filter((p) => p.organizationId === orgId);
    if (orgProjects.length > 0) {
      setSelectedProjectId(orgProjects[0].id);
    } else {
      setSelectedProjectId(null);
    }
  }

  function handleProjectChange(projectId: string) {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setSelectedOrganizationId(project.organizationId);
      setSelectedProjectId(projectId as any);
    }
  }

  return (
    <Sidebar className="border-r border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(9,13,22,0.98))]">
      <SidebarHeader className="border-b border-white/5 px-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-primary shadow-[0_0_18px_rgba(20,180,100,0.14)]">
            <ScissorsLineDashed className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display text-lg font-semibold tracking-tight text-white">AluGamma</span>
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">DXF Workspace</p>
          </div>
        </Link>

        {authenticated && organizations.length > 0 && (
          <div className="mt-4 space-y-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between border-white/10 bg-white/[0.02] text-left hover:bg-white/5"
                >
                  <span className="truncate">{selectedOrganization?.name || "Select Organization"}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {organizations.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => handleOrganizationChange(org.id)}
                    className={org.id === selectedOrganizationId ? "bg-primary/10 text-primary" : ""}
                  >
                    <span className="truncate">{org.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between border-white/10 bg-white/[0.02] text-left hover:bg-white/5"
                  disabled={!selectedOrganizationId || organizationProjects.length === 0}
                >
                  <span className="truncate">{selectedProject?.name || "Select Project"}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuLabel>Projects</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {organizationProjects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => handleProjectChange(project.id)}
                    className={project.id === selectedProjectId ? "bg-primary/10 text-primary" : ""}
                  >
                    <span className="truncate">{project.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
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

        {authenticated && selectedProject && (
          <SidebarGroup className="min-h-0 flex-1 overflow-hidden">
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Designs in {selectedProject.name}
            </SidebarGroupLabel>
            <SidebarGroupContent className="min-h-0">
              <ScrollArea className="h-[calc(100vh-380px)]">
                <SidebarMenuSub className="space-y-1 pr-3">
                  <SidebarMenuSubButton
                    asChild
                    isActive={location.pathname === "/sheet-metal" || location.pathname === "/sheet-metal/new"}
                    className="mb-2 text-slate-300 hover:text-white"
                  >
                    <Link
                      to="/sheet-metal/new"
                      onClick={() => {
                        if (location.pathname === "/sheet-metal" || location.pathname === "/sheet-metal/new") {
                          startNewDesign();
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      <span>New draft</span>
                    </Link>
                  </SidebarMenuSubButton>

                  {selectedProject.designs.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-white/8 px-3 py-4 text-center text-xs text-slate-500">
                      No saved designs yet.
                    </div>
                  ) : (
                    selectedProject.designs.map((design) => (
                      <SidebarMenuSubButton
                        key={design.id}
                        asChild
                        isActive={location.pathname === `/sheet-metal/${design.id}`}
                        className="text-slate-300 hover:text-white"
                      >
                        <Link to={`/sheet-metal/${design.id}`}>
                          <FileStack className="h-4 w-4" />
                          <span className="truncate">{design.name}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    ))
                  )}
                </SidebarMenuSub>
              </ScrollArea>
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
