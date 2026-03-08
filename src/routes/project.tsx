import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
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

                                {(project.designs?.length ?? 0) > 0 && (
                                    <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value="designs" className="border-white/10 border-b-0">
                                            <AccordionTrigger className="py-2 text-sm hover:no-underline">
                                                View Designs
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="flex flex-col gap-2 pt-2">
                                                    {project.designs.map(design => (
                                                        <div key={design.id} className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="truncate font-medium">{design.name}</span>
                                                                    {design.isStarred && <Badge variant="secondary" className="px-1 py-0 h-4 text-[10px]">★</Badge>}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1 shrink-0">
                                                                <Button asChild variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                                                    <Link to={`/project/${project.id}/${design.id}`}>Preview</Link>
                                                                </Button>
                                                                <Button asChild variant="secondary" size="sm" className="h-6 px-2 text-xs">
                                                                    <Link to={`/sheet-metal/${design.id}`}>Edit</Link>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                )}

                                <div className="mt-auto pt-4">
                                    <Button asChild variant="secondary" className="w-full">
                                        <Link to={`/project/${project.id}`}>View Project Details</Link>
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
