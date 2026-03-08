import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/features/workspace/context";

export default function OrganizationDetailPage() {
    const { orgId } = useParams<{ orgId: string }>();
    const { authenticated, isLoadingWorkspace, organizations, projects } = useWorkspace();

    if (isLoadingWorkspace) {
        return (
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-10 lg:px-8">
                <Card className="border-white/10 bg-card/85">
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">Loading...</CardContent>
                </Card>
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-10 lg:px-8">
                <Card className="border-white/10 bg-card/85">
                    <CardHeader>
                        <CardTitle>Sign in required</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>You need to be signed in to view this organization.</p>
                        <Button asChild>
                            <Link to="/auth">Sign in</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const organization = organizations.find((o) => o.id === orgId);
    const orgProjects = projects.filter((p) => p.organizationId === orgId);

    if (!organization) {
        return (
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-10 lg:px-8">
                <Card className="border-white/10 bg-card/85">
                    <CardHeader>
                        <CardTitle>Organization not found</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        You do not have access to this organization or it does not exist.
                    </CardContent>
                    <CardContent>
                        <Button asChild>
                            <Link to="/organization">Back to Organizations</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-10 lg:px-8">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="sm" className="hidden sm:flex">
                    <Link to="/organization">← Back</Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                    {organization.role}
                </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-white/10 bg-card/85 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Projects in {organization.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {orgProjects.length === 0 ? (
                            <p className="text-sm text-muted-foreground">There are no projects in this organization.</p>
                        ) : (
                            <ul className="space-y-4">
                                {orgProjects.map((project) => (
                                    <li key={project.id} className="cursor-pointer rounded-lg border border-white/5 bg-black/20 p-4 transition-colors hover:bg-white/[0.02]">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold">{project.name}</h3>
                                            <span className="text-xs font-medium text-muted-foreground">{project.role}</span>
                                        </div>
                                        {project.description && (
                                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                                        )}
                                        <div className="mt-4">
                                            <Button asChild variant="secondary" size="sm">
                                                <Link to={`/project/${project.id}`}>Open Project</Link>
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-card/85">
                    <CardHeader>
                        <CardTitle>Organization Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span>Name</span>
                            <span className="font-medium text-foreground">{organization.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span>Slug</span>
                            <span className="font-medium text-foreground">{organization.slug}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span>Members</span>
                            <span className="font-medium text-foreground">{organization.memberCount}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span>Projects</span>
                            <span className="font-medium text-foreground">{organization.projectCount}</span>
                        </div>
                        {["owner", "admin", "manager"].includes(organization.role) && (
                            <div className="pt-4">
                                <Button variant="outline" className="w-full">
                                    Organization Settings (Coming Soon)
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
