export type ProjectStatus = 'active' | 'on_hold' | 'completed';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Client {
    id: number;
    user_id: number;
    name: string;
    email: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    projects_count?: number;
    tasks_count?: number;
    done_tasks_count?: number;
    projects?: Project[];
}

export interface Project {
    id: number;
    client_id: number;
    name: string;
    status: ProjectStatus;
    deadline: string | null;
    budget_hours: string | null;
    created_at: string;
    updated_at: string;
    client?: Client;
    tasks?: Task[];
    tasks_count?: number;
    done_tasks_count?: number;
}

export interface Task {
    id: number;
    project_id: number;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    estimated_hours: string | null;
    completed_at: string | null;
    is_overdue: boolean;
    created_at: string;
    updated_at: string;
    project?: Project;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
    first_page_url: string;
    last_page_url: string;
    next_page_url: string | null;
    prev_page_url: string | null;
    path: string;
}
