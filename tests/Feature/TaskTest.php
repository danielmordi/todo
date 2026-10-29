<?php

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Client;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Carbon\CarbonImmutable;

test('owner can view tasks index', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);
    Task::factory()->count(5)->create(['project_id' => $project->id]);

    $response = $this->actingAs($user)->get(route('tasks.index'));

    $response->assertOk();
});

test('new user with no clients or projects can view tasks index', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('tasks.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tasks/index')
        ->has('projects', 0)
        ->has('clients', 0)
    );
});

test('owner can create a task under their project', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);

    $response = $this->actingAs($user)->post(route('tasks.store'), [
        'project_id' => $project->id,
        'title' => 'Build authentication flow',
        'description' => 'Implement session cookies and forms.',
        'status' => TaskStatus::Todo->value,
        'priority' => TaskPriority::High->value,
        'due_date' => '2026-11-01',
        'estimated_hours' => 4.50,
    ]);

    $response->assertRedirect();
    $task = Task::where('title', 'Build authentication flow')->first();
    expect($task)->not->toBeNull()
        ->and($task->project_id)->toBe($project->id)
        ->and($task->status)->toBe(TaskStatus::Todo)
        ->and($task->priority)->toBe(TaskPriority::High);
});

test('owner can update their task', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);
    $task = Task::factory()->create([
        'project_id' => $project->id,
        'title' => 'Initial Title',
    ]);

    $response = $this->actingAs($user)->put(route('tasks.update', $task), [
        'title' => 'Revised Title',
        'status' => TaskStatus::InProgress->value,
        'priority' => TaskPriority::Medium->value,
    ]);

    $response->assertRedirect();
    expect($task->fresh()->title)->toBe('Revised Title')
        ->and($task->fresh()->status)->toBe(TaskStatus::InProgress);
});

test('owner can delete their task', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);
    $task = Task::factory()->create(['project_id' => $project->id]);

    $response = $this->actingAs($user)->delete(route('tasks.destroy', $task));

    $response->assertRedirect();
    expect(Task::find($task->id))->toBeNull();
});

test('second user gets 403 when updating another users task', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user1->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);
    $task = Task::factory()->create(['project_id' => $project->id]);

    $response = $this->actingAs($user2)->put(route('tasks.update', $task), [
        'title' => 'Hacked Task Title',
        'status' => TaskStatus::Done->value,
        'priority' => TaskPriority::High->value,
    ]);

    $response->assertForbidden();
});

test('second user gets 403 when deleting another users task', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user1->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);
    $task = Task::factory()->create(['project_id' => $project->id]);

    $response = $this->actingAs($user2)->delete(route('tasks.destroy', $task));

    $response->assertForbidden();
    expect(Task::find($task->id))->not->toBeNull();
});

test('second user cannot create a task under another users project', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user1->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);

    $response = $this->actingAs($user2)->post(route('tasks.store'), [
        'project_id' => $project->id,
        'title' => 'Injected Task',
        'status' => TaskStatus::Todo->value,
        'priority' => TaskPriority::High->value,
    ]);

    $response->assertForbidden();
    expect(Task::where('title', 'Injected Task')->count())->toBe(0);
});

test('setting a task done sets completed_at and moving it back clears it', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);

    // Create initially in todo status
    $task = Task::create([
        'project_id' => $project->id,
        'title' => 'Lifecycle test task',
        'status' => TaskStatus::Todo,
        'priority' => TaskPriority::Medium,
    ]);

    expect($task->completed_at)->toBeNull();

    // Move to done
    $task->update(['status' => TaskStatus::Done]);
    $task->refresh();

    expect($task->status)->toBe(TaskStatus::Done)
        ->and($task->completed_at)->not->toBeNull();

    // Move back to in_progress
    $task->update(['status' => TaskStatus::InProgress]);
    $task->refresh();

    expect($task->status)->toBe(TaskStatus::InProgress)
        ->and($task->completed_at)->toBeNull();
});

test('overdue filter excludes done tasks and tasks due today', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);

    $tz = config('app.timezone', 'UTC');
    $today = CarbonImmutable::now($tz);

    // 1. Truly overdue task (due in past, status != done)
    $overdueTask = Task::create([
        'project_id' => $project->id,
        'title' => 'Overdue Task',
        'status' => TaskStatus::Todo,
        'priority' => TaskPriority::High,
        'due_date' => $today->subDays(2)->toDateString(),
    ]);

    // 2. Task due today (should be EXCLUDED from overdue)
    $todayTask = Task::create([
        'project_id' => $project->id,
        'title' => 'Due Today Task',
        'status' => TaskStatus::Todo,
        'priority' => TaskPriority::Medium,
        'due_date' => $today->toDateString(),
    ]);

    // 3. Task in past but already done (should be EXCLUDED from overdue)
    $donePastTask = Task::create([
        'project_id' => $project->id,
        'title' => 'Past Done Task',
        'status' => TaskStatus::Done,
        'priority' => TaskPriority::Low,
        'due_date' => $today->subDays(5)->toDateString(),
    ]);

    // 4. Task in future (should be EXCLUDED from overdue)
    $futureTask = Task::create([
        'project_id' => $project->id,
        'title' => 'Future Task',
        'status' => TaskStatus::InProgress,
        'priority' => TaskPriority::Low,
        'due_date' => $today->addDays(3)->toDateString(),
    ]);

    $response = $this->actingAs($user)->get(route('tasks.index', ['due' => 'overdue']));

    $response->assertOk();

    // Verify through the scope directly as well as the controller response
    $overdueScopeIds = Task::overdue()->pluck('id')->all();

    expect($overdueScopeIds)->toContain($overdueTask->id)
        ->and($overdueScopeIds)->not->toContain($todayTask->id)
        ->and($overdueScopeIds)->not->toContain($donePastTask->id)
        ->and($overdueScopeIds)->not->toContain($futureTask->id);
});
