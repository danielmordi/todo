import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    ExternalLink,
    FolderKanban,
    PlayCircle,
    User,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { dashboard } from '@/routes';
import projects from '@/routes/projects';
import tasks from '@/routes/tasks';
import type { BreadcrumbItem, Task, TaskStatus } from '@/types';
import { formatDate, formatHours } from '@/lib/utils';

interface DashboardProps {
    dueTodayTasks: Task[];
    overdueTasks: Task[];
    inProgressTasks: Task[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
    },
];

function priorityBadgeVariant(priority: string): 'default' | 'destructive' | 'secondary' | 'outline' {
    switch (priority) {
        case 'high':
            return 'destructive';
        case 'medium':
            return 'default';
        default:
            return 'secondary';
    }
}

function statusLabel(status: TaskStatus): string {
    switch (status) {
        case 'todo':
            return 'To Do';
        case 'in_progress':
            return 'In Progress';
        case 'blocked':
            return 'Blocked';
        case 'done':
            return 'Done';
    }
}

export default function Dashboard({
    dueTodayTasks = [],
    overdueTasks = [],
    inProgressTasks = [],
}: DashboardProps) {
    const handleStatusChange = (taskId: number, newStatus: TaskStatus) => {
        router.patch(
            tasks.updateStatus.url(taskId),
            { status: newStatus },
            { preserveScroll: true }
        );
    };

    const renderTaskItem = (task: Task, context: 'overdue' | 'today' | 'progress') => {
        const clientName = task.project?.client?.name ?? 'Unknown Client';
        const projectName = task.project?.name ?? 'Unknown Project';

        return (
            <div
                key={task.id}
                className="group flex flex-col justify-between gap-3 rounded-lg border border-border/70 bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-xs sm:flex-row sm:items-center"
            >
                <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground text-sm tracking-tight truncate">
                            {task.title}
                        </span>
                        <Badge variant={priorityBadgeVariant(task.priority)} className="capitalize text-xs font-semibold">
                            {task.priority}
                        </Badge>
                        {context === 'overdue' && (
                            <Badge variant="destructive" className="text-xs">
                                Overdue
                            </Badge>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            <User className="size-3.5 text-muted-foreground/70" />
                            <span className="truncate max-w-[140px]">{clientName}</span>
                        </span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="inline-flex items-center gap-1">
                            <FolderKanban className="size-3.5 text-muted-foreground/70" />
                            <span className="truncate max-w-[160px]">{projectName}</span>
                        </span>
                        {task.due_date && (
                            <>
                                <span className="text-muted-foreground/40">•</span>
                                <span className="inline-flex items-center gap-1">
                                    <Calendar className="size-3.5 text-muted-foreground/70" />
                                    <span>{formatDate(task.due_date)}</span>
                                </span>
                            </>
                        )}
                        {task.estimated_hours && (
                            <>
                                <span className="text-muted-foreground/40">•</span>
                                <span className="inline-flex items-center gap-1">
                                    <Clock className="size-3.5 text-muted-foreground/70" />
                                    <span>{formatHours(task.estimated_hours)}</span>
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs capitalize">
                                {statusLabel(task.status)}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'todo')}>
                                To Do
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'in_progress')}>
                                In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'blocked')}>
                                Blocked
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'done')}>
                                Done
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
                        <Link href={projects.show.url(task.project_id)}>
                            <ExternalLink className="size-3.5" />
                            <span className="sr-only">Go to project</span>
                        </Link>
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Operational Overview</h1>
                    <p className="text-sm text-muted-foreground">
                        Your real-time focus list across active clients and projects.
                    </p>
                </div>

                {/* 3 Metric Header Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-red-200/60 dark:border-red-900/30">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
                                Overdue Tasks
                            </CardTitle>
                            <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-foreground">{overdueTasks.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Requires urgent client coordination</p>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-200/60 dark:border-amber-900/30">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                Due Today
                            </CardTitle>
                            <Calendar className="size-4 text-amber-600 dark:text-amber-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-foreground">{dueTodayTasks.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Deadlines scheduled for today</p>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200/60 dark:border-blue-900/30">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                In Progress
                            </CardTitle>
                            <PlayCircle className="size-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-foreground">{inProgressTasks.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Currently active development tasks</p>
                        </CardContent>
                    </Card>
                </div>

                {/* 3 Main Sections */}
                <div className="grid gap-6">
                    {/* 1. Overdue Section */}
                    <Card className="border-border/80">
                        <CardHeader className="border-b border-border/40 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <AlertTriangle className="size-5 text-red-500" />
                                        Overdue Tasks ({overdueTasks.length})
                                    </CardTitle>
                                    <CardDescription>
                                        Tasks with due dates prior to today that are not completed.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {overdueTasks.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                                    <CheckCircle2 className="size-8 text-emerald-500/80" />
                                    <span>No overdue tasks. All deadlines are on track!</span>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {overdueTasks.map((task) => renderTaskItem(task, 'overdue'))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 2. Due Today Section */}
                    <Card className="border-border/80">
                        <CardHeader className="border-b border-border/40 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <Calendar className="size-5 text-amber-500" />
                                        Due Today ({dueTodayTasks.length})
                                    </CardTitle>
                                    <CardDescription>
                                        Tasks with commitments ending today.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {dueTodayTasks.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    No tasks due today.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {dueTodayTasks.map((task) => renderTaskItem(task, 'today'))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 3. In Progress Section */}
                    <Card className="border-border/80">
                        <CardHeader className="border-b border-border/40 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <PlayCircle className="size-5 text-blue-500" />
                                        Tasks in Progress ({inProgressTasks.length})
                                    </CardTitle>
                                    <CardDescription>
                                        Tasks currently in active development or review.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {inProgressTasks.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    No tasks currently in progress.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {inProgressTasks.map((task) => renderTaskItem(task, 'progress'))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
