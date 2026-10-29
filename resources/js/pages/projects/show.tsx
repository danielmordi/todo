import { Head, Link, router, useForm } from '@inertiajs/react';
import type React from 'react';
import { useState } from 'react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    Edit2,
    MoreHorizontal,
    Plus,
    Trash2,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import tasksRoute from '@/routes/tasks';
import type { BreadcrumbItem, Project, Task, TaskPriority, TaskStatus } from '@/types';
import { formatDate, formatHours } from '@/lib/utils';

interface ProjectShowProps {
    project: Project & {
        tasks: Task[];
    };
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'todo', title: 'To Do', color: 'border-slate-300 dark:border-slate-700' },
    { id: 'in_progress', title: 'In Progress', color: 'border-blue-400 dark:border-blue-600' },
    { id: 'blocked', title: 'Blocked', color: 'border-rose-400 dark:border-rose-600' },
    { id: 'done', title: 'Done', color: 'border-emerald-400 dark:border-emerald-600' },
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

export default function ProjectShow({ project }: ProjectShowProps) {
    const client = project.client;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard.url(),
        },
        ...(client
            ? [
                  {
                      title: client.name,
                      href: clientsRoute.show.url(client.id),
                  },
              ]
            : []),
        {
            title: project.name,
            href: projectsRoute.show.url(project.id),
        },
    ];

    const [createTaskOpen, setCreateTaskOpen] = useState(false);
    const [editTaskTarget, setEditTaskTarget] = useState<Task | null>(null);
    const [deleteTaskTarget, setDeleteTaskTarget] = useState<Task | null>(null);
    const [deleteProjectConfirmOpen, setDeleteProjectConfirmOpen] = useState(false);

    // Create Task Form (Pre-fills project_id: project.id)
    const {
        data: newTaskData,
        setData: setNewTaskData,
        post: postNewTask,
        processing: newTaskProcessing,
        errors: newTaskErrors,
        reset: resetNewTask,
    } = useForm({
        project_id: project.id,
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
    const { delete: destroyProject, processing: deleteProjectProcessing } = useForm();

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

    const handleDeleteProject = () => {
        destroyProject(projectsRoute.destroy.url(project.id));
    };

    const handleStatusUpdate = (taskId: number, newStatus: TaskStatus) => {
        router.patch(
            tasksRoute.updateStatus.url(taskId),
            { status: newStatus },
            { preserveScroll: true }
        );
    };

    const tasksList = project.tasks ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.name} - Board`} />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Project Header */}
                <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            {client && (
                                <Link
                                    href={clientsRoute.show.url(client.id)}
                                    className="text-xs font-medium text-muted-foreground hover:underline"
                                >
                                    {client.name}
                                </Link>
                            )}
                            <span className="text-muted-foreground/40">•</span>
                            <Badge variant="outline" className="capitalize text-xs">
                                {project.status.replace('_', ' ')}
                            </Badge>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            {project.deadline && (
                                <span className="inline-flex items-center gap-1">
                                    <Calendar className="size-3.5" />
                                    <span>Deadline: {project.deadline}</span>
                                </span>
                            )}
                            {project.budget_hours && (
                                <span className="inline-flex items-center gap-1">
                                    <Clock className="size-3.5" />
                                    <span>Budget: {project.budget_hours}h</span>
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button onClick={() => setCreateTaskOpen(true)} className="gap-2">
                            <Plus className="size-4" />
                            Add Task
                        </Button>
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setDeleteProjectConfirmOpen(true)}
                            title="Delete project"
                        >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Delete Project</span>
                        </Button>
                    </div>
                </div>

                {/* 4 Kanban Columns: todo, in_progress, blocked, done */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {COLUMNS.map((column) => {
                        const columnTasks = tasksList.filter((t) => t.status === column.id);

                        return (
                            <div
                                key={column.id}
                                className="flex flex-col rounded-xl border border-border/80 bg-muted/30 p-3 min-h-[500px]"
                            >
                                <div className="flex items-center justify-between pb-3 px-1 border-b border-border/40 mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2.5 w-2.5 rounded-full border-2 ${column.color}`} />
                                        <h3 className="text-sm font-semibold text-foreground tracking-tight">
                                            {column.title}
                                        </h3>
                                    </div>
                                    <Badge variant="secondary" className="text-xs px-2 py-0">
                                        {columnTasks.length}
                                    </Badge>
                                </div>

                                <div className="flex-1 space-y-3 overflow-y-auto">
                                    {columnTasks.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-muted-foreground/60 italic">
                                            No tasks
                                        </div>
                                    ) : (
                                        columnTasks.map((task) => (
                                            <Card
                                                key={task.id}
                                                className="border-border/80 bg-card shadow-xs transition-all hover:border-foreground/30"
                                            >
                                                <CardHeader className="p-3.5 pb-2">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <CardTitle className="text-sm font-medium leading-snug line-clamp-2">
                                                            {task.title}
                                                        </CardTitle>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-6 text-muted-foreground hover:text-foreground shrink-0"
                                                                >
                                                                    <MoreHorizontal className="size-3.5" />
                                                                    <span className="sr-only">Task actions</span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleOpenEditTask(task)}>
                                                                    <Edit2 className="size-3.5 mr-2" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => setDeleteTaskTarget(task)}
                                                                    className="text-destructive"
                                                                >
                                                                    <Trash2 className="size-3.5 mr-2" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    {task.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </CardHeader>

                                                <CardContent className="p-3.5 pt-0 space-y-2.5">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <Badge
                                                            variant={priorityBadgeVariant(task.priority)}
                                                            className="text-[11px] capitalize font-medium py-0 px-1.5"
                                                        >
                                                            {task.priority}
                                                        </Badge>

                                                        {task.is_overdue && (
                                                            <Badge variant="destructive" className="text-[11px] py-0 px-1.5 gap-1">
                                                                <AlertTriangle className="size-3" />
                                                                Overdue
                                                            </Badge>
                                                        )}

                                                        {task.completed_at && (
                                                            <Badge variant="secondary" className="text-[11px] py-0 px-1.5 gap-1 text-emerald-600 dark:text-emerald-400">
                                                                <CheckCircle2 className="size-3" />
                                                                Done
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-2">
                                                        {task.due_date ? (
                                                            <span className="inline-flex items-center gap-1">
                                                                <Calendar className="size-3" />
                                                                <span>{formatDate(task.due_date)}</span>
                                                            </span>
                                                        ) : (
                                                            <span className="italic text-muted-foreground/60">No due date</span>
                                                        )}

                                                        {task.estimated_hours && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <Clock className="size-3" />
                                                                <span>{formatHours(task.estimated_hours)}</span>
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Status Dropdown per Task (No drag and drop) */}
                                                    <div className="pt-1">
                                                        <Select
                                                            value={task.status}
                                                            onValueChange={(val) => handleStatusUpdate(task.id, val as TaskStatus)}
                                                        >
                                                            <SelectTrigger className="h-7 text-xs w-full">
                                                                <SelectValue placeholder="Status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="todo">To Do</SelectItem>
                                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                                <SelectItem value="blocked">Blocked</SelectItem>
                                                                <SelectItem value="done">Done</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Create Task Dialog (Pre-filled with project_id) */}
            <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Task to {project.name}</DialogTitle>
                        <DialogDescription>
                            Create a task assigned to this project.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="task-title">Title *</Label>
                            <Input
                                id="task-title"
                                placeholder="e.g. Implement header navigation"
                                value={newTaskData.title}
                                onChange={(e) => setNewTaskData('title', e.target.value)}
                                maxLength={255}
                                required
                                autoFocus
                            />
                            <InputError message={newTaskErrors.title} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="task-desc">Description</Label>
                            <textarea
                                id="task-desc"
                                rows={3}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                placeholder="Requirements, links, acceptance criteria..."
                                value={newTaskData.description}
                                onChange={(e) => setNewTaskData('description', e.target.value)}
                            />
                            <InputError message={newTaskErrors.description} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="task-status">Status</Label>
                                <Select
                                    value={newTaskData.status}
                                    onValueChange={(val) => setNewTaskData('status', val as TaskStatus)}
                                >
                                    <SelectTrigger id="task-status">
                                        <SelectValue placeholder="Status" />
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
                                <Label htmlFor="task-priority">Priority</Label>
                                <Select
                                    value={newTaskData.priority}
                                    onValueChange={(val) => setNewTaskData('priority', val as TaskPriority)}
                                >
                                    <SelectTrigger id="task-priority">
                                        <SelectValue placeholder="Priority" />
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
                                <Label htmlFor="task-due">Due Date</Label>
                                <Input
                                    id="task-due"
                                    type="date"
                                    value={newTaskData.due_date}
                                    onChange={(e) => setNewTaskData('due_date', e.target.value)}
                                />
                                <InputError message={newTaskErrors.due_date} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="task-hours">Est. Hours</Label>
                                <Input
                                    id="task-hours"
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max="9999"
                                    placeholder="2.5"
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
                                {newTaskProcessing ? 'Adding...' : 'Add Task'}
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
                            <Label htmlFor="edit-task-title">Title *</Label>
                            <Input
                                id="edit-task-title"
                                value={editTaskData.title}
                                onChange={(e) => setEditTaskData('title', e.target.value)}
                                maxLength={255}
                                required
                            />
                            <InputError message={editTaskErrors.title} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-task-desc">Description</Label>
                            <textarea
                                id="edit-task-desc"
                                rows={3}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                value={editTaskData.description}
                                onChange={(e) => setEditTaskData('description', e.target.value)}
                            />
                            <InputError message={editTaskErrors.description} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-task-status">Status</Label>
                                <Select
                                    value={editTaskData.status}
                                    onValueChange={(val) => setEditTaskData('status', val as TaskStatus)}
                                >
                                    <SelectTrigger id="edit-task-status">
                                        <SelectValue placeholder="Status" />
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
                                <Label htmlFor="edit-task-priority">Priority</Label>
                                <Select
                                    value={editTaskData.priority}
                                    onValueChange={(val) => setEditTaskData('priority', val as TaskPriority)}
                                >
                                    <SelectTrigger id="edit-task-priority">
                                        <SelectValue placeholder="Priority" />
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
                                <Label htmlFor="edit-task-due">Due Date</Label>
                                <Input
                                    id="edit-task-due"
                                    type="date"
                                    value={editTaskData.due_date}
                                    onChange={(e) => setEditTaskData('due_date', e.target.value)}
                                />
                                <InputError message={editTaskErrors.due_date} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-task-hours">Est. Hours</Label>
                                <Input
                                    id="edit-task-hours"
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

            {/* Delete Project Confirmation */}
            <Dialog open={deleteProjectConfirmOpen} onOpenChange={setDeleteProjectConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <Trash2 className="size-5" />
                            Delete Project "{project.name}"?
                        </DialogTitle>
                        <DialogDescription>
                            This will permanently delete this project and all {tasksList.length} tasks under it.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteProjectConfirmOpen(false)}
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
