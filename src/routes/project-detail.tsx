import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/features/workspace/context";

export default function ProjectDetailPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const { authenticated, isLoadingWorkspace, projects } = useWorkspace();

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
                        <p>You need to be signed in to view this project.</p>
                        <Button asChild>
                            <Link to="/auth">Sign in</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const project = projects.find((p) => p.id === projectId);

    if (!project) {
        return (
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-10 lg:px-8">
                <Card className="border-white/10 bg-card/85">
                    <CardHeader>
                        <CardTitle>Project not found</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        You do not have access to this project or it does not exist.
                    </CardContent>
                    <CardContent>
                        <Button asChild>
                            <Link to="/project">Back to Projects</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-10 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="sm" className="hidden sm:flex">
                        <Link to="/project">← Back</Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            in organization <Link to={`/organization/${project.organizationId}`} className="hover:underline">{project.organizationName}</Link>
                        </p>
                    </div>
                </div>
                <div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                        {project.role}
                    </span>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-white/10 bg-card/85 lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle>Designs</CardTitle>
                        <Button asChild size="sm">
                            <Link to={`/sheet-metal/new?project=${project.id}`}>New Design</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {project.designs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">There are no designs in this project.</p>
                        ) : (
                            <ul className="space-y-4">
                                {project.designs.map((design) => (
                                    <li key={design.id} className="cursor-pointer rounded-lg border border-white/5 bg-black/20 p-4 transition-colors hover:bg-white/[0.02]">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">{design.name}</h3>
                                                    {design.isStarred && <Badge variant="secondary" className="px-1 text-[10px]">★</Badge>}
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Last updated: {new Date(design.updatedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link to={`/project/${project.id}/${design.id}`}>Preview</Link>
                                                </Button>
                                                <Button asChild size="sm">
                                                    <Link to={`/sheet-metal/${design.id}`}>Edit</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-card/85 h-fit">
                    <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        {project.description && (
                            <div className="border-b border-white/5 pb-4">
                                <span className="mb-1 block">Description</span>
                                <span className="text-foreground">{project.description}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span>Designs count</span>
                            <span className="font-medium text-foreground">{project.designs.length}</span>
                        </div>
                        {["owner", "editor", "admin", "manager"].includes(project.role) && (
                            <div className="pt-4">
                                <Button variant="outline" className="w-full">
                                    Project Settings (Coming Soon)
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
