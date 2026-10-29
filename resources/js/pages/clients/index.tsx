import { Head, Link, useForm } from '@inertiajs/react';
import type React from 'react';
import { useState } from 'react';
import {
    Briefcase,
    Building2,
    CheckCircle2,
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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';
import clientsRoute from '@/routes/clients';
import type { BreadcrumbItem, Client } from '@/types';

interface ClientsIndexProps {
    clients: Client[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
    },
    {
        title: 'Clients',
        href: clientsRoute.index.url(),
    },
];

export default function ClientsIndex({ clients = [] }: ClientsIndexProps) {
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

    const {
        data: createData,
        setData: setCreateData,
        post: postCreate,
        processing: createProcessing,
        errors: createErrors,
        reset: resetCreate,
    } = useForm({
        name: '',
        email: '',
        notes: '',
    });

    const { delete: destroyClient, processing: deleteProcessing } = useForm();

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postCreate(clientsRoute.store.url(), {
            onSuccess: () => {
                setCreateOpen(false);
                resetCreate();
            },
        });
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;

        destroyClient(clientsRoute.destroy.url(deleteTarget.id), {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Clients</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage client roster, contact info, and linked projects.
                        </p>
                    </div>

                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add Client
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add New Client</DialogTitle>
                                <DialogDescription>
                                    Enter client details to organize upcoming projects and track work.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="client-name">Client Name *</Label>
                                    <Input
                                        id="client-name"
                                        placeholder="e.g. Acme Studio"
                                        value={createData.name}
                                        onChange={(e) => setCreateData('name', e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <InputError message={createErrors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="client-email">Contact Email</Label>
                                    <Input
                                        id="client-email"
                                        type="email"
                                        placeholder="client@example.com"
                                        value={createData.email}
                                        onChange={(e) => setCreateData('email', e.target.value)}
                                    />
                                    <InputError message={createErrors.email} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="client-notes">Notes / Background</Label>
                                    <textarea
                                        id="client-notes"
                                        rows={3}
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        placeholder="Key contacts, billing cycle, domain details..."
                                        value={createData.notes}
                                        onChange={(e) => setCreateData('notes', e.target.value)}
                                    />
                                    <InputError message={createErrors.notes} />
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCreateOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={createProcessing}>
                                        {createProcessing ? 'Saving...' : 'Create Client'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {clients.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-12 text-center">
                        <Building2 className="size-12 text-muted-foreground/50 mb-3" />
                        <h3 className="text-lg font-semibold text-foreground">No clients yet</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                            Get started by adding your first freelance client to organize your projects and deadlines.
                        </p>
                        <Button onClick={() => setCreateOpen(true)} className="gap-2">
                            <Plus className="size-4" />
                            Add First Client
                        </Button>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {clients.map((client) => {
                            const projectsCount = client.projects_count ?? 0;
                            const tasksCount = client.tasks_count ?? 0;
                            const doneTasksCount = client.done_tasks_count ?? 0;

                            return (
                                <Card
                                    key={client.id}
                                    className="group flex flex-col justify-between transition-all hover:border-foreground/30 hover:shadow-xs"
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-1 min-w-0">
                                                <CardTitle className="text-base font-semibold truncate">
                                                    <Link
                                                        href={clientsRoute.show.url(client.id)}
                                                        className="hover:underline"
                                                    >
                                                        {client.name}
                                                    </Link>
                                                </CardTitle>
                                                {client.email ? (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                                                        <Mail className="size-3 shrink-0" />
                                                        <span className="truncate">{client.email}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/60 italic">
                                                        No email recorded
                                                    </span>
                                                )}
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-destructive opacity-70 group-hover:opacity-100"
                                                onClick={() => setDeleteTarget(client)}
                                            >
                                                <Trash2 className="size-4" />
                                                <span className="sr-only">Delete client</span>
                                            </Button>
                                        </div>

                                        {client.notes && (
                                            <p className="line-clamp-2 text-xs text-muted-foreground/90 mt-2">
                                                {client.notes}
                                            </p>
                                        )}
                                    </CardHeader>

                                    <CardContent className="pt-0">
                                        <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <FolderKanban className="size-3.5" />
                                                <span>{projectsCount} {projectsCount === 1 ? 'project' : 'projects'}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                                <span>{doneTasksCount} / {tasksCount} tasks done</span>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <Button variant="outline" size="sm" asChild className="w-full text-xs">
                                                <Link href={clientsRoute.show.url(client.id)}>
                                                    View Client Projects
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <Trash2 className="size-5" />
                            Confirm Client Deletion
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
                            This action will permanently delete this client along with all associated projects and tasks via database cascade.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                            disabled={deleteProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={deleteProcessing}
                        >
                            {deleteProcessing ? 'Deleting...' : 'Delete Client & Cascade'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
