<?php

use App\Enums\ProjectStatus;
use App\Models\Client;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;

test('owner can view project show page', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);
    Task::factory()->count(3)->create(['project_id' => $project->id]);

    $response = $this->actingAs($user)->get(route('projects.show', $project));

    $response->assertOk();
});

test('owner can create a project under their client', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->post(route('projects.store'), [
        'client_id' => $client->id,
        'name' => 'Storefront V2',
        'status' => ProjectStatus::Active->value,
        'deadline' => '2026-12-31',
        'budget_hours' => 50.00,
    ]);

    $project = Project::where('name', 'Storefront V2')->first();
    expect($project)->not->toBeNull()
        ->and($project->client_id)->toBe($client->id);

    $response->assertRedirect(route('projects.show', $project));
});

test('owner can update their project', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $project = Project::factory()->create([
        'client_id' => $client->id,
        'name' => 'Original Name',
        'status' => ProjectStatus::Active->value,
    ]);

    $response = $this->actingAs($user)->put(route('projects.update', $project), [
        'name' => 'Renamed Project',
        'status' => ProjectStatus::Completed->value,
        'deadline' => '2026-11-15',
        'budget_hours' => 30.00,
    ]);

    $response->assertRedirect(route('projects.show', $project));
    expect($project->fresh()->name)->toBe('Renamed Project')
        ->and($project->fresh()->status)->toBe(ProjectStatus::Completed);
});

test('owner can delete their project and it cascades to tasks', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);
    $task = Task::factory()->create(['project_id' => $project->id]);

    $response = $this->actingAs($user)->delete(route('projects.destroy', $project));

    $response->assertRedirect(route('clients.show', $client->id));
    expect(Project::find($project->id))->toBeNull()
        ->and(Task::find($task->id))->toBeNull();
});

test('second user gets 403 when viewing another users project', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user1->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);

    $response = $this->actingAs($user2)->get(route('projects.show', $project));

    $response->assertForbidden();
});

test('second user gets 403 when updating another users project', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user1->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);

    $response = $this->actingAs($user2)->put(route('projects.update', $project), [
        'name' => 'Unauthorized Name',
        'status' => ProjectStatus::Active->value,
    ]);

    $response->assertForbidden();
});

test('second user gets 403 when deleting another users project', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user1->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);

    $response = $this->actingAs($user2)->delete(route('projects.destroy', $project));

    $response->assertForbidden();
    expect(Project::find($project->id))->not->toBeNull();
});

test('second user cannot create a project under another users client', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user1->id]);

    $response = $this->actingAs($user2)->post(route('projects.store'), [
        'client_id' => $client->id,
        'name' => 'Injected Project',
        'status' => ProjectStatus::Active->value,
    ]);

    $response->assertForbidden();
    expect(Project::where('name', 'Injected Project')->count())->toBe(0);
});
