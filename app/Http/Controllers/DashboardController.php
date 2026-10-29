<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $today = now(config('app.timezone'))->toDateString();

        $tasksQuery = Task::query()
            ->whereHas('project.client', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with(['project.client']);

        $dueTodayTasks = (clone $tasksQuery)
            ->whereDate('due_date', '=', $today)
            ->orderBy('priority', 'desc')
            ->get();

        $overdueTasks = (clone $tasksQuery)
            ->where('status', '!=', TaskStatus::Done->value)
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', $today)
            ->orderBy('due_date', 'asc')
            ->get();

        $inProgressTasks = (clone $tasksQuery)
            ->where('status', '=', TaskStatus::InProgress->value)
            ->orderBy('priority', 'desc')
            ->get();

        return Inertia::render('dashboard', [
            'dueTodayTasks' => $dueTodayTasks,
            'overdueTasks' => $overdueTasks,
            'inProgressTasks' => $inProgressTasks,
        ]);
    }
}
