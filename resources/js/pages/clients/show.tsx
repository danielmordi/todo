import { Head, Link, useForm } from '@inertiajs/react';
import type React from 'react';
import { useState } from 'react';
import {
    Calendar,
    CheckCircle2,
    Clock,
    Edit2,
    ExternalLink,
    FolderKanban,
    Mail,
    Plus,
    Trash2,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import clientsRoute from '@/routes/clients';
import projectsRoute from '@/routes/projects';
import type { BreadcrumbItem, Client, Project, ProjectStatus } from '@/types';

interface ClientShowProps {
    client: Client & {
        projects: (Project & {
            tasks_count: number;
            done_tasks_count: number;
        })[];
    };
}

function projectStatusVariant(status: ProjectStatus): 'default' | 'secondary' | 'outline' {
    switch (status) {
        case 'active':
            return 'default';
        case 'completed':
            return 'secondary';
        case 'on_hold':
            return 'outline';
    }
}

function projectStatusLabel(status: ProjectStatus): string {
    switch (status) {
        case 'active':
            return 'Active';
        case 'completed':
            return 'Completed';
        case 'on_hold':
            return 'On Hold';
    }
}

export default function ClientShow({ client }: ClientShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard.url(),
        },
        {
            title: 'Clients',
            href: clientsRoute.index.url(),
        },
        {
            title: client.name,
            href: clientsRoute.show.url(client.id),
        },
    ];

    const [editClientOpen, setEditClientOpen] = useState(false);
    const [createProjectOpen, setCreateProjectOpen] = useState(false);
    const [deleteClientConfirmOpen, setDeleteClientConfirmOpen] = useState(false);
    const [deleteProjectTarget, setDeleteProjectTarget] = useState<Project | null>(null);

    // Edit Client Form
    const {
        data: editData,
        setData: setEditData,
        put: putEdit,
        processing: editProcessing,
        errors: editErrors,
    } = useForm({
        name: client.name,
        email: client.email ?? '',
        notes: client.notes ?? '',
    });

    // Create Project Form
    const {
        data: newProjectData,
        setData: setNewProjectData,
        post: postNewProject,
        processing: newProjectProcessing,
        errors: newProjectErrors,
        reset: resetNewProject,
    } = useForm({
        client_id: client.id,
        name: '',
        status: 'active' as ProjectStatus,
        deadline: '',
        budget_hours: '',
    });

    const { delete: destroyClient, processing: deleteClientProcessing } = useForm();
    const { delete: destroyProject, processing: deleteProjectProcessing } = useForm();

    const handleEditClientSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        putEdit(clientsRoute.update.url(client.id), {
            onSuccess: () => setEditClientOpen(false),
        });
    };

    const handleCreateProjectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postNewProject(projectsRoute.store.url(), {
            onSuccess: () => {
                setCreateProjectOpen(false);
                resetNewProject();
            },
        });
    };

    const handleDeleteClient = () => {
        destroyClient(clientsRoute.destroy.url(client.id));
    };

    const handleDeleteProject = () => {
        if (!deleteProjectTarget) return;

        destroyProject(projectsRoute.destroy.url(deleteProjectTarget.id), {
            onSuccess: () => setDeleteProjectTarget(null),
        });
    };

    const projectsList = client.projects ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${client.name} - Projects`} />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Client Profile Header */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    {client.name}
                                </h1>
                            </div>
                            {client.email && (
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Mail className="size-4 shrink-0" />
                                    <span>{client.email}</span>
                                </div>
                            )}
                            {client.notes && (
                                <p className="text-sm text-muted-foreground/90 max-w-2xl mt-2 whitespace-pre-wrap">
                                    {client.notes}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditClientOpen(true)}
                                className="gap-1.5"
                            >
                                <Edit2 className="size-3.5" />
                                Edit Client
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteClientConfirmOpen(true)}
                                className="gap-1.5"
                            >
                                <Trash2 className="size-3.5" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Projects Section Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight text-foreground">Projects</h2>
                        <p className="text-sm text-muted-foreground">
                            Active and archived projects for {client.name}.
                        </p>
                    </div>

                    <Button onClick={() => setCreateProjectOpen(true)} className="gap-2">
                        <Plus className="size-4" />
                        New Project
                    </Button>
                </div>

                {/* Projects List */}
                {projectsList.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-12 text-center">
                        <FolderKanban className="size-12 text-muted-foreground/50 mb-3" />
                        <h3 className="text-lg font-semibold text-foreground">No projects yet</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                            Create your first project under {client.name} to start tracking tasks and deadlines.
                        </p>
                        <Button onClick={() => setCreateProjectOpen(true)} className="gap-2">
                            <Plus className="size-4" />
                            Create Project
                        </Button>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {projectsList.map((project) => {
                            const totalTasks = project.tasks_count ?? 0;
                            const doneTasks = project.done_tasks_count ?? 0;
                            const percentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

                            return (
                                <Card
                                    key={project.id}
                                    className="flex flex-col justify-between transition-all hover:border-foreground/30 hover:shadow-xs"
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-1 min-w-0">
                                                <CardTitle className="text-base font-semibold truncate">
                                                    <Link
                                                        href={projectsRoute.show.url(project.id)}
                                                        className="hover:underline"
                                                    >
                                                        {project.name}
                                                    </Link>
                                                </CardTitle>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={projectStatusVariant(project.status)} className="capitalize text-xs">
                                                        {projectStatusLabel(project.status)}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => setDeleteProjectTarget(project)}
                                            >
                                                <Trash2 className="size-4" />
                                                <span className="sr-only">Delete project</span>
                                            </Button>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-3">
                                            {project.deadline && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="size-3.5" />
                                                    <span>{project.deadline}</span>
                                                </div>
                                            )}
                                            {project.budget_hours && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="size-3.5" />
                                                    <span>{project.budget_hours}h budget</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4 pt-0">
                                        {/* Progress Bar (done / total tasks) */}
                                        <div className="space-y-1.5 border-t border-border/40 pt-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-foreground">Task Progress</span>
                                                <span className="text-muted-foreground">
                                                    {doneTasks} / {totalTasks} ({percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                                <div
                                                    className="h-full bg-primary transition-all duration-300 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>

                                        <Button variant="outline" size="sm" asChild className="w-full text-xs gap-1.5">
                                            <Link href={projectsRoute.show.url(project.id)}>
                                                <span>Open Task Board</span>
                                                <ExternalLink className="size-3.5" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Edit Client Dialog */}
            <Dialog open={editClientOpen} onOpenChange={setEditClientOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Client</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditClientSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Client Name *</Label>
                            <Input
                                id="edit-name"
                                value={editData.name}
                                onChange={(e) => setEditData('name', e.target.value)}
                                required
                            />
                            <InputError message={editErrors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editData.email}
                                onChange={(e) => setEditData('email', e.target.value)}
                            />
                            <InputError message={editErrors.email} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-notes">Notes</Label>
                            <textarea
                                id="edit-notes"
                                rows={3}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                value={editData.notes}
                                onChange={(e) => setEditData('notes', e.target.value)}
                            />
                            <InputError message={editErrors.notes} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditClientOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editProcessing}>
                                {editProcessing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Project Dialog */}
            <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        <DialogDescription>
                            Create a project for <strong>{client.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="proj-name">Project Name *</Label>
                            <Input
                                id="proj-name"
                                placeholder="e.g. Website Redesign"
                                value={newProjectData.name}
                                onChange={(e) => setNewProjectData('name', e.target.value)}
                                required
                                autoFocus
                            />
                            <InputError message={newProjectErrors.name} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="proj-status">Status</Label>
                                <Select
                                    value={newProjectData.status}
                                    onValueChange={(val) => setNewProjectData('status', val as ProjectStatus)}
                                >
                                    <SelectTrigger id="proj-status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="on_hold">On Hold</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={newProjectErrors.status} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="proj-budget">Budget (Hours)</Label>
                                <Input
                                    id="proj-budget"
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max="9999"
                                    placeholder="40.00"
                                    value={newProjectData.budget_hours}
                                    onChange={(e) => setNewProjectData('budget_hours', e.target.value)}
                                />
                                <InputError message={newProjectErrors.budget_hours} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="proj-deadline">Deadline (Optional)</Label>
                            <Input
                                id="proj-deadline"
                                type="date"
                                value={newProjectData.deadline}
                                onChange={(e) => setNewProjectData('deadline', e.target.value)}
                            />
                            <InputError message={newProjectErrors.deadline} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateProjectOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={newProjectProcessing}>
                                {newProjectProcessing ? 'Creating...' : 'Create Project'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Client Confirmation */}
            <Dialog open={deleteClientConfirmOpen} onOpenChange={setDeleteClientConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <Trash2 className="size-5" />
                            Delete Client "{client.name}"?
                        </DialogTitle>
                        <DialogDescription>
                            This will permanently delete <strong>{client.name}</strong> along with all associated projects and tasks via database cascade.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteClientConfirmOpen(false)}
                            disabled={deleteClientProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteClient}
                            disabled={deleteClientProcessing}
                        >
                            {deleteClientProcessing ? 'Deleting...' : 'Delete Client & Cascade'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Project Confirmation */}
            <Dialog open={deleteProjectTarget !== null} onOpenChange={(open) => !open && setDeleteProjectTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <Trash2 className="size-5" />
                            Delete Project "{deleteProjectTarget?.name}"?
                        </DialogTitle>
                        <DialogDescription>
                            This will permanently delete this project and all tasks under it.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteProjectTarget(null)}
                            disabled={deleteProjectProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteProject}
                            disabled={deleteProjectProcessing}
                        >
                            {deleteProjectProcessing ? 'Deleting...' : 'Delete Project & Cascade'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
