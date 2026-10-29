<?php

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Client;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskCreatedNotification;
use Carbon\CarbonImmutable;
use Illuminate\Console\Scheduling\Event;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;

test('it returns success and does not call slack when no tasks are due or overdue', function () {
    Http::fake();

    $this->artisan('tasks:send-reminders')
        ->expectsOutput('No tasks are due today or overdue. No reminder needed.')
        ->assertSuccessful();

    Http::assertNothingSent();
});

test('it executes dry run mode without making any http calls', function () {
    Http::fake();

    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id, 'name' => 'Acme Corp']);
    $project = Project::factory()->create(['client_id' => $client->id, 'name' => 'Redesign']);

    $today = CarbonImmutable::now(config('app.timezone'))->toDateString();
    $yesterday = CarbonImmutable::now(config('app.timezone'))->subDay()->toDateString();

    Task::factory()->create([
        'project_id' => $project->id,
        'title' => 'Overdue Task 1',
        'status' => TaskStatus::Todo->value,
        'due_date' => $yesterday,
    ]);

    Task::factory()->create([
        'project_id' => $project->id,
        'title' => 'Today Task 1',
        'status' => TaskStatus::Todo->value,
        'due_date' => $today,
    ]);

    $this->artisan('tasks:send-reminders', ['--dry-run' => true])
        ->expectsOutputToContain('Dry run mode enabled: Found 1 overdue task(s) and 1 task(s) due today.')
        ->assertSuccessful();

    Http::assertNothingSent();
});

test('it fails when slack is not configured and not in dry-run mode', function () {
    Config::set('services.slack.notifications.webhook_url', null);
    Config::set('services.slack.notifications.bot_user_oauth_token', null);
    Config::set('services.slack.notifications.channel', null);

    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);

    $today = CarbonImmutable::now(config('app.timezone'))->toDateString();
    Task::factory()->create([
        'project_id' => $project->id,
        'status' => TaskStatus::Todo->value,
        'due_date' => $today,
    ]);

    $this->artisan('tasks:send-reminders')
        ->expectsOutputToContain('Slack is not configured.')
        ->assertFailed();
});

test('it sends task reminder to slack webhook when configured', function () {
    $webhookUrl = 'https://hooks.slack.com/services/T00/B00/XXXX';
    Config::set('services.slack.notifications.webhook_url', $webhookUrl);

    Http::fake([
        $webhookUrl => Http::response(['ok' => true], 200),
    ]);

    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id, 'name' => 'Initech']);
    $project = Project::factory()->create(['client_id' => $client->id, 'name' => 'Backend API']);

    $today = CarbonImmutable::now(config('app.timezone'))->toDateString();
    $yesterday = CarbonImmutable::now(config('app.timezone'))->subDays(2)->toDateString();

    Task::factory()->create([
        'project_id' => $project->id,
        'title' => 'Fix urgent bug',
        'status' => TaskStatus::InProgress->value,
        'priority' => TaskPriority::High->value,
        'due_date' => $yesterday,
    ]);

    Task::factory()->create([
        'project_id' => $project->id,
        'title' => 'Deploy v1 to staging',
        'status' => TaskStatus::Todo->value,
        'priority' => TaskPriority::Medium->value,
        'due_date' => $today,
    ]);

    $this->artisan('tasks:send-reminders')
        ->expectsOutputToContain('Successfully sent reminder for 2 task(s) to Slack.')
        ->assertSuccessful();

    Http::assertSent(function ($request) use ($webhookUrl) {
        if ($request->url() !== $webhookUrl) {
            return false;
        }

        $payload = $request->data();
        $blocks = $payload['blocks'] ?? [];

        expect($payload)->toHaveKey('text')
            ->and($blocks)->not->toBeEmpty();

        $encoded = json_encode($blocks);
        expect($encoded)->toContain('Fix urgent bug')
            ->and($encoded)->toContain('Deploy v1 to staging')
            ->and($encoded)->toContain('Initech')
            ->and($encoded)->toContain('Backend API');

        return true;
    });
});

test('it sends task reminder using slack bot token when configured', function () {
    Config::set('services.slack.notifications.webhook_url', null);
    Config::set('services.slack.notifications.bot_user_oauth_token', 'xoxb-test-token');
    Config::set('services.slack.notifications.channel', '#freelance-tasks');

    Http::fake([
        'https://slack.com/api/chat.postMessage' => Http::response(['ok' => true], 200),
    ]);

    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);

    $today = CarbonImmutable::now(config('app.timezone'))->toDateString();

    Task::factory()->create([
        'project_id' => $project->id,
        'title' => 'Send invoice',
        'status' => TaskStatus::Todo->value,
        'due_date' => $today,
    ]);

    $this->artisan('tasks:send-reminders')
        ->expectsOutputToContain('Successfully sent reminder for 1 task(s) to Slack.')
        ->assertSuccessful();

    Http::assertSent(function ($request) {
        return $request->url() === 'https://slack.com/api/chat.postMessage'
            && $request->hasHeader('Authorization', 'Bearer xoxb-test-token')
            && ($request->data()['channel'] ?? null) === '#freelance-tasks';
    });
});

test('it filters tasks by --overdue-only and --due-today-only flags', function () {
    $webhookUrl = 'https://hooks.slack.com/services/T00/B00/XXXX';
    Config::set('services.slack.notifications.webhook_url', $webhookUrl);

    Http::fake([
        $webhookUrl => Http::response(['ok' => true], 200),
    ]);

    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);

    $today = CarbonImmutable::now(config('app.timezone'))->toDateString();
    $yesterday = CarbonImmutable::now(config('app.timezone'))->subDay()->toDateString();

    Task::factory()->create([
        'project_id' => $project->id,
        'title' => 'Only Overdue',
        'status' => TaskStatus::Todo->value,
        'due_date' => $yesterday,
    ]);

    Task::factory()->create([
        'project_id' => $project->id,
        'title' => 'Only Today',
        'status' => TaskStatus::Todo->value,
        'due_date' => $today,
    ]);

    // Test overdue only
    $this->artisan('tasks:send-reminders', ['--overdue-only' => true])
        ->expectsOutputToContain('Successfully sent reminder for 1 task(s) to Slack.')
        ->assertSuccessful();

    Http::assertSent(function ($request) {
        $encoded = json_encode($request->data());

        return str_contains($encoded, 'Only Overdue') && ! str_contains($encoded, 'Only Today');
    });

    Http::fake([
        $webhookUrl => Http::response(['ok' => true], 200),
    ]);

    // Test due today only
    $this->artisan('tasks:send-reminders', ['--due-today-only' => true])
        ->expectsOutputToContain('Successfully sent reminder for 1 task(s) to Slack.')
        ->assertSuccessful();

    Http::assertSent(function ($request) {
        $encoded = json_encode($request->data());

        return str_contains($encoded, 'Only Today') && ! str_contains($encoded, 'Only Overdue');
    });
});

test('done tasks are excluded from reminders even if due in the past or today', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);

    $today = CarbonImmutable::now(config('app.timezone'))->toDateString();
    $yesterday = CarbonImmutable::now(config('app.timezone'))->subDay()->toDateString();

    Task::factory()->create([
        'project_id' => $project->id,
        'title' => 'Done Yesterday',
        'status' => TaskStatus::Done->value,
        'due_date' => $yesterday,
    ]);

    Task::factory()->create([
        'project_id' => $project->id,
        'title' => 'Done Today',
        'status' => TaskStatus::Done->value,
        'due_date' => $today,
    ]);

    $this->artisan('tasks:send-reminders')
        ->expectsOutput('No tasks are due today or overdue. No reminder needed.')
        ->assertSuccessful();
});

test('it dispatches TaskCreatedNotification when enabled in config', function () {
    Notification::fake();
    Config::set('services.slack.notifications.notify_on_task_created', true);

    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);

    $response = $this->actingAs($user)->post(route('tasks.store'), [
        'project_id' => $project->id,
        'title' => 'Brand New Task',
        'status' => TaskStatus::Todo->value,
        'priority' => TaskPriority::High->value,
        'due_date' => '2026-11-10',
    ]);

    $response->assertRedirect();

    Notification::assertSentTo(
        new AnonymousNotifiable,
        TaskCreatedNotification::class,
        function (TaskCreatedNotification $notification) {
            return $notification->task->title === 'Brand New Task';
        }
    );
});

test('it does not dispatch TaskCreatedNotification when disabled in config', function () {
    Notification::fake();
    Config::set('services.slack.notifications.notify_on_task_created', false);

    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);

    $response = $this->actingAs($user)->post(route('tasks.store'), [
        'project_id' => $project->id,
        'title' => 'Silent Task Creation',
        'status' => TaskStatus::Todo->value,
        'priority' => TaskPriority::Medium->value,
    ]);

    $response->assertRedirect();

    Notification::assertNothingSent();
});

test('it registers tasks:send-reminders in schedule with configured time and overlap protection', function () {
    $schedule = app(Schedule::class);

    $event = collect($schedule->events())->first(function (Event $e) {
        return str_contains($e->command, 'tasks:send-reminders');
    });

    expect($event)->not->toBeNull();
    expect($event->description)->toBe('Send Slack reminders for due and overdue tasks');
    expect($event->withoutOverlapping)->toBeTrue();
    expect($event->timezone)->toBe(config('app.timezone'));
    expect($event->expression)->toBe('0 9 * * *');
});
