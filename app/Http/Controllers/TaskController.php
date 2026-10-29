<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Requests\UpdateTaskStatusRequest;
use App\Models\Project;
use App\Models\Task;
use App\Notifications\Channels\SlackChannel;
use App\Notifications\TaskCreatedNotification;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Task::class);

        $user = $request->user();
        $tz = config('app.timezone', 'UTC');
        $today = CarbonImmutable::now($tz)->toDateString();
        $startOfWeek = CarbonImmutable::now($tz)->startOfWeek()->toDateString();
        $endOfWeek = CarbonImmutable::now($tz)->endOfWeek()->toDateString();

        $query = Task::query()
            ->whereHas('project.client', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->with(['project.client']);

        if ($request->filled('client_id')) {
            $query->whereHas('project', function ($q) use ($request) {
                $q->where('client_id', $request->input('client_id'));
            });
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->input('project_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        if ($request->filled('due')) {
            $due = $request->input('due');
            if ($due === 'overdue') {
                $query->where('status', '!=', TaskStatus::Done->value)
                    ->whereNotNull('due_date')
                    ->whereDate('due_date', '<', $today);
            } elseif ($due === 'today') {
                $query->whereDate('due_date', '=', $today);
            } elseif ($due === 'this_week') {
                $query->whereDate('due_date', '>=', $startOfWeek)
                    ->whereDate('due_date', '<=', $endOfWeek);
            }
        }

        $tasks = $query->orderBy('due_date', 'asc')
            ->orderBy('priority', 'desc')
            ->paginate(15)
            ->withQueryString();

        $clients = $user->clients()->orderBy('name')->get(['id', 'name']);
        $projects = Project::whereHas('client', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->orderBy('name')->get(['id', 'name', 'client_id']);

        return Inertia::render('tasks/index', [
            'tasks' => $tasks,
            'clients' => $clients,
            'projects' => $projects,
            'filters' => $request->only(['client_id', 'project_id', 'status', 'priority', 'due']),
        ]);
    }

    public function store(StoreTaskRequest $request): RedirectResponse
    {
        Gate::authorize('create', Task::class);

        $task = Task::create($request->validated());

        if (config('services.slack.notifications.notify_on_task_created')) {
            $task->loadMissing(['project.client']);
            Notification::route(SlackChannel::class, null)
                ->notify(new TaskCreatedNotification($task));
        }

        return back();
    }

    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse
    {
        Gate::authorize('update', $task);

        $task->update($request->validated());

        return back();
    }

    public function updateStatus(UpdateTaskStatusRequest $request, Task $task): RedirectResponse
    {
        Gate::authorize('update', $task);

        $task->update([
            'status' => $request->validated('status'),
        ]);

        return back();
    }

    public function destroy(Task $task): RedirectResponse
    {
        Gate::authorize('delete', $task);

        $task->delete();

        return back();
    }
}
