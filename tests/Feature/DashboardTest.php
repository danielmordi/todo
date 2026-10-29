<?php

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Client;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Carbon\CarbonImmutable;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page from dashboard', function () {
    $response = $this->get(route('dashboard'));

    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard and see categorized tasks', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);

    $tz = config('app.timezone', 'UTC');
    $today = CarbonImmutable::now($tz);

    // 1. Task due today
    $dueToday = Task::create([
        'project_id' => $project->id,
        'title' => 'Due Today Task',
        'status' => TaskStatus::Todo,
        'priority' => TaskPriority::High,
        'due_date' => $today->toDateString(),
    ]);

    // 2. Overdue task
    $overdue = Task::create([
        'project_id' => $project->id,
        'title' => 'Overdue Task',
        'status' => TaskStatus::Todo,
        'priority' => TaskPriority::Medium,
        'due_date' => $today->subDays(3)->toDateString(),
    ]);

    // 3. In progress task
    $inProgress = Task::create([
        'project_id' => $project->id,
        'title' => 'In Progress Task',
        'status' => TaskStatus::InProgress,
        'priority' => TaskPriority::High,
        'due_date' => $today->addDays(5)->toDateString(),
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->has('dueTodayTasks', 1)
        ->where('dueTodayTasks.0.id', $dueToday->id)
        ->has('overdueTasks', 1)
        ->where('overdueTasks.0.id', $overdue->id)
        ->has('inProgressTasks', 1)
        ->where('inProgressTasks.0.id', $inProgress->id)
    );
});
