import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/features/workspace/context";

export default function ProjectPage() {
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
                        <p>You need to be signed in to view your projects.</p>
                        <Button asChild>
                            <Link to="/auth">Sign in</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-10 lg:px-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            </div>

            {projects.length === 0 ? (
                <Card className="border-white/10 bg-card/85">
                    <CardHeader>
                        <CardTitle>No projects found</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        You are not a member of any projects yet.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Card key={project.id} className="flex flex-col border-white/10 bg-card/85 transition-colors hover:bg-card/95">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center justify-between gap-4">
                                    <span className="truncate">{project.name}</span>
                                    <span className="flex-shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                        {project.role}
                                    </span>
                                </CardTitle>
                                <div className="text-xs text-muted-foreground">
                                    Org: {project.organizationName}
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-1 flex-col gap-4">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>{project.designs?.length ?? 0} design{(project.designs?.length ?? 0) !== 1 && "s"}</span>
                                </div>
                                <div className="mt-auto pt-4">
                                    <Button asChild variant="secondary" className="w-full">
                                        <Link to={`/project/${project.id}`}>View Project</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
