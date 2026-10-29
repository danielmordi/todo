import { Head, Link, router, useForm } from '@inertiajs/react';
import type React from 'react';
import { useState } from 'react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    Edit2,
    ExternalLink,
    Filter,
    FolderKanban,
    Plus,
    RotateCcw,
    Trash2,
    User,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import projectsRoute from '@/routes/projects';
import tasksRoute from '@/routes/tasks';
import type {
    BreadcrumbItem,
    PaginatedData,
    ProjectStatus,
    Task,
    TaskPriority,
    TaskStatus,
} from '@/types';
import { formatDate } from '@/lib/utils';

interface TasksIndexProps {
    tasks: PaginatedData<Task>;
    clients: { id: number; name: string }[];
    projects: { id: number; name: string; client_id: number }[];
    filters: {
        client_id?: string;
        project_id?: string;
        status?: string;
        priority?: string;
        due?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
    },
    {
        title: 'Tasks',
        href: tasksRoute.index.url(),
    },
];

function priorityBadgeVariant(priority: TaskPriority): 'default' | 'destructive' | 'secondary' | 'outline' {
    switch (priority) {
        case 'high':
            return 'destructive';
        case 'medium':
            return 'default';
        case 'low':
            return 'secondary';
    }
}

export default function TasksIndex({
    tasks,
    clients = [],
    projects = [],
    filters = {},
}: TasksIndexProps) {
    const [createTaskOpen, setCreateTaskOpen] = useState(false);
    const [editTaskTarget, setEditTaskTarget] = useState<Task | null>(null);
    const [deleteTaskTarget, setDeleteTaskTarget] = useState<Task | null>(null);

    // Create Task Form
    const {
        data: newTaskData,
        setData: setNewTaskData,
        post: postNewTask,
        processing: newTaskProcessing,
        errors: newTaskErrors,
        reset: resetNewTask,
    } = useForm({
        project_id: projects[0]?.id ? String(projects[0].id) : '',
        title: '',
        description: '',
        status: 'todo' as TaskStatus,
        priority: 'medium' as TaskPriority,
        due_date: '',
        estimated_hours: '',
    });

    // Edit Task Form
    const {
        data: editTaskData,
        setData: setEditTaskData,
        put: putEditTask,
        processing: editTaskProcessing,
        errors: editTaskErrors,
    } = useForm({
        title: '',
        description: '',
        status: 'todo' as TaskStatus,
        priority: 'medium' as TaskPriority,
        due_date: '',
        estimated_hours: '',
    });

    const { delete: destroyTask, processing: deleteTaskProcessing } = useForm();

    const handleFilterChange = (key: string, value: string) => {
        const nextFilters = {
            ...filters,
            [key]: value === 'all' || !value ? undefined : value,
        };

        if (key === 'client_id') {
            nextFilters.project_id = undefined;
        }

        router.get(tasksRoute.index.url(), nextFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const handleResetFilters = () => {
        router.get(tasksRoute.index.url(), {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handleStatusUpdate = (taskId: number, newStatus: TaskStatus) => {
        router.patch(
            tasksRoute.updateStatus.url(taskId),
            { status: newStatus },
            { preserveScroll: true }
        );
    };

    const handleCreateTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postNewTask(tasksRoute.store.url(), {
            onSuccess: () => {
                setCreateTaskOpen(false);
                resetNewTask();
            },
        });
    };

    const handleOpenEditTask = (task: Task) => {
        setEditTaskTarget(task);
        setEditTaskData({
            title: task.title,
            description: task.description ?? '',
            status: task.status,
            priority: task.priority,
            due_date: task.due_date ?? '',
            estimated_hours: task.estimated_hours ?? '',
        });
    };

    const handleEditTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTaskTarget) return;

        putEditTask(tasksRoute.update.url(editTaskTarget.id), {
            onSuccess: () => setEditTaskTarget(null),
        });
    };

    const handleDeleteTaskConfirm = () => {
        if (!deleteTaskTarget) return;

        destroyTask(tasksRoute.destroy.url(deleteTaskTarget.id), {
            onSuccess: () => setDeleteTaskTarget(null),
        });
    };

    const hasActiveFilters = Boolean(
        filters.client_id || filters.project_id || filters.status || filters.priority || filters.due
    );

    const filteredProjects = filters.client_id
        ? projects.filter((p) => p.client_id === Number(filters.client_id))
        : projects;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="All Tasks" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tasks</h1>
                        <p className="text-sm text-muted-foreground">
                            Browse, filter, and update tasks across all active projects.
                        </p>
                    </div>

                    <Button onClick={() => setCreateTaskOpen(true)} className="gap-2" disabled={projects.length === 0}>
                        <Plus className="size-4" />
                        Create Task
                    </Button>
                </div>

                {/* Filter Toolbar */}
                <Card className="border-border/80">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Filter className="size-4 text-muted-foreground" />
                                Filter Criteria
                            </CardTitle>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <RotateCcw className="size-3.5" />
                                    Reset Filters
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                        {/* Client Filter */}
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Client</Label>
                            <Select
                                value={filters.client_id ?? 'all'}
                                onValueChange={(val) => handleFilterChange('client_id', val)}
                            >
                                <SelectTrigger className="h-9 text-xs w-full">
                                    <SelectValue placeholder="All Clients" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Clients</SelectItem>
                                    {clients.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Project Filter */}
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Project</Label>
                            <Select
                                value={filters.project_id ?? 'all'}
                                onValueChange={(val) => handleFilterChange('project_id', val)}
                            >
                                <SelectTrigger className="h-9 text-xs w-full">
                                    <SelectValue placeholder="All Projects" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Projects</SelectItem>
                                    {filteredProjects.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Status</Label>
                            <Select
                                value={filters.status ?? 'all'}
                                onValueChange={(val) => handleFilterChange('status', val)}
                            >
                                <SelectTrigger className="h-9 text-xs w-full">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="todo">To Do</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="blocked">Blocked</SelectItem>
                                    <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Priority Filter */}
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Priority</Label>
                            <Select
                                value={filters.priority ?? 'all'}
                                onValueChange={(val) => handleFilterChange('priority', val)}
                            >
                                <SelectTrigger className="h-9 text-xs w-full">
                                    <SelectValue placeholder="All Priorities" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priorities</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Due Date Filter */}
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Due Date</Label>
                            <Select
                                value={filters.due ?? 'all'}
                                onValueChange={(val) => handleFilterChange('due', val)}
                            >
                                <SelectTrigger className="h-9 text-xs w-full">
                                    <SelectValue placeholder="Any Time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any Time</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                    <SelectItem value="today">Due Today</SelectItem>
                                    <SelectItem value="this_week">Due This Week</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Tasks Table */}
                <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Task Title</th>
                                    <th className="px-4 py-3">Project & Client</th>
                                    <th className="px-4 py-3">Priority</th>
                                    <th className="px-4 py-3">Due Date</th>
                                    <th className="px-4 py-3">Est. Hours</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {tasks.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                                            No tasks found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    tasks.data.map((task) => (
                                        <tr key={task.id} className="transition-colors hover:bg-muted/20">
                                            <td className="px-4 py-3.5 max-w-[280px]">
                                                <div className="font-medium text-foreground truncate">
                                                    {task.title}
                                                </div>
                                                {task.description && (
                                                    <div className="text-xs text-muted-foreground truncate max-w-[260px] mt-0.5">
                                                        {task.description}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="flex flex-col text-xs">
                                                    <Link
                                                        href={projectsRoute.show.url(task.project_id)}
                                                        className="font-medium text-foreground hover:underline inline-flex items-center gap-1"
                                                    >
                                                        <span>{task.project?.name}</span>
                                                        <ExternalLink className="size-3 text-muted-foreground/60" />
                                                    </Link>
                                                    <span className="text-muted-foreground text-[11px]">
                                                        {task.project?.client?.name}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <Badge
                                                    variant={priorityBadgeVariant(task.priority)}
                                                    className="capitalize text-xs font-medium"
                                                >
                                                    {task.priority}
                                                </Badge>
                                            </td>

                                            <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                                                {task.due_date ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="size-3.5 text-muted-foreground" />
                                                        <span className={task.is_overdue ? 'text-destructive font-semibold' : 'text-foreground'}>
                                                            {formatDate(task.due_date)}
                                                        </span>
                                                        {task.is_overdue && (
                                                            <Badge variant="destructive" className="text-[10px] py-0 px-1">
                                                                Overdue
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground/60 italic">—</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                                                {task.estimated_hours ? `${task.estimated_hours}h` : '—'}
                                            </td>

                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <Select
                                                    value={task.status}
                                                    onValueChange={(val) => handleStatusUpdate(task.id, val as TaskStatus)}
                                                >
                                                    <SelectTrigger className="h-8 text-xs w-[125px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="todo">To Do</SelectItem>
                                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                                        <SelectItem value="blocked">Blocked</SelectItem>
                                                        <SelectItem value="done">Done</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </td>

                                            <td className="px-4 py-3.5 whitespace-nowrap text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-muted-foreground hover:text-foreground"
                                                        onClick={() => handleOpenEditTask(task)}
                                                    >
                                                        <Edit2 className="size-3.5" />
                                                        <span className="sr-only">Edit task</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => setDeleteTaskTarget(task)}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                        <span className="sr-only">Delete task</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination (15 per page, preserves query string) */}
                    {tasks.total > tasks.per_page && (
                        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
                            <div className="text-xs text-muted-foreground">
                                Showing <strong>{tasks.from ?? 0}</strong> to <strong>{tasks.to ?? 0}</strong> of{' '}
                                <strong>{tasks.total}</strong> results
                            </div>
                            <div className="flex items-center gap-1">
                                {tasks.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-8 px-3 text-xs"
                                        disabled={!link.url}
                                        asChild={Boolean(link.url)}
                                    >
                                        {link.url ? (
                                            <Link href={link.url} preserveState preserveScroll>
                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                            </Link>
                                        ) : (
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Task Dialog */}
            <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Task</DialogTitle>
                        <DialogDescription>
                            Assign a task to any client project.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-task-project">Project *</Label>
                            <Select
                                value={newTaskData.project_id}
                                onValueChange={(val) => setNewTaskData('project_id', val)}
                            >
                                <SelectTrigger id="create-task-project">
                                    <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={newTaskErrors.project_id} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="create-task-title">Title *</Label>
                            <Input
                                id="create-task-title"
                                placeholder="e.g. Implement payment gateway"
                                value={newTaskData.title}
                                onChange={(e) => setNewTaskData('title', e.target.value)}
                                maxLength={255}
                                required
                                autoFocus
                            />
                            <InputError message={newTaskErrors.title} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="create-task-desc">Description</Label>
                            <textarea
                                id="create-task-desc"
                                rows={3}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                value={newTaskData.description}
                                onChange={(e) => setNewTaskData('description', e.target.value)}
                            />
                            <InputError message={newTaskErrors.description} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="create-task-status">Status</Label>
                                <Select
                                    value={newTaskData.status}
                                    onValueChange={(val) => setNewTaskData('status', val as TaskStatus)}
                                >
                                    <SelectTrigger id="create-task-status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todo">To Do</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="blocked">Blocked</SelectItem>
                                        <SelectItem value="done">Done</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={newTaskErrors.status} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="create-task-priority">Priority</Label>
                                <Select
                                    value={newTaskData.priority}
                                    onValueChange={(val) => setNewTaskData('priority', val as TaskPriority)}
                                >
                                    <SelectTrigger id="create-task-priority">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={newTaskErrors.priority} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="create-task-due">Due Date</Label>
                                <Input
                                    id="create-task-due"
                                    type="date"
                                    value={newTaskData.due_date}
                                    onChange={(e) => setNewTaskData('due_date', e.target.value)}
                                />
                                <InputError message={newTaskErrors.due_date} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="create-task-hours">Est. Hours</Label>
                                <Input
                                    id="create-task-hours"
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max="9999"
                                    placeholder="3.0"
                                    value={newTaskData.estimated_hours}
                                    onChange={(e) => setNewTaskData('estimated_hours', e.target.value)}
                                />
                                <InputError message={newTaskErrors.estimated_hours} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateTaskOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={newTaskProcessing}>
                                {newTaskProcessing ? 'Creating...' : 'Create Task'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Task Dialog */}
            <Dialog open={editTaskTarget !== null} onOpenChange={(open) => !open && setEditTaskTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditTaskSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-table-title">Title *</Label>
                            <Input
                                id="edit-table-title"
                                value={editTaskData.title}
                                onChange={(e) => setEditTaskData('title', e.target.value)}
                                maxLength={255}
                                required
                            />
                            <InputError message={editTaskErrors.title} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-table-desc">Description</Label>
                            <textarea
                                id="edit-table-desc"
                                rows={3}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                value={editTaskData.description}
                                onChange={(e) => setEditTaskData('description', e.target.value)}
                            />
                            <InputError message={editTaskErrors.description} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-table-status">Status</Label>
                                <Select
                                    value={editTaskData.status}
                                    onValueChange={(val) => setEditTaskData('status', val as TaskStatus)}
                                >
                                    <SelectTrigger id="edit-table-status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todo">To Do</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="blocked">Blocked</SelectItem>
                                        <SelectItem value="done">Done</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={editTaskErrors.status} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-table-priority">Priority</Label>
                                <Select
                                    value={editTaskData.priority}
                                    onValueChange={(val) => setEditTaskData('priority', val as TaskPriority)}
                                >
                                    <SelectTrigger id="edit-table-priority">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={editTaskErrors.priority} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-table-due">Due Date</Label>
                                <Input
                                    id="edit-table-due"
                                    type="date"
                                    value={editTaskData.due_date}
                                    onChange={(e) => setEditTaskData('due_date', e.target.value)}
                                />
                                <InputError message={editTaskErrors.due_date} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-table-hours">Est. Hours</Label>
                                <Input
                                    id="edit-table-hours"
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max="9999"
                                    value={editTaskData.estimated_hours}
                                    onChange={(e) => setEditTaskData('estimated_hours', e.target.value)}
                                />
                                <InputError message={editTaskErrors.estimated_hours} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditTaskTarget(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editTaskProcessing}>
                                {editTaskProcessing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Task Confirmation */}
            <Dialog open={deleteTaskTarget !== null} onOpenChange={(open) => !open && setDeleteTaskTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <Trash2 className="size-5" />
                            Delete Task
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deleteTaskTarget?.title}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteTaskTarget(null)}
                            disabled={deleteTaskProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteTaskConfirm}
                            disabled={deleteTaskProcessing}
                        >
                            {deleteTaskProcessing ? 'Deleting...' : 'Delete Task'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
