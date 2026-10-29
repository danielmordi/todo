<?php

use App\Models\Client;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;

test('owner can view clients index', function () {
    $user = User::factory()->create();
    Client::factory()->count(3)->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->get(route('clients.index'));

    $response->assertOk();
});

test('owner can view client show page', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->get(route('clients.show', $client));

    $response->assertOk();
});

test('owner can create a client', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('clients.store'), [
        'name' => 'Acme Inc',
        'email' => 'contact@acme.com',
        'notes' => 'Preferred client',
    ]);

    $client = Client::where('name', 'Acme Inc')->first();
    expect($client)->not->toBeNull()
        ->and($client->user_id)->toBe($user->id);

    $response->assertRedirect(route('clients.show', $client));
});

test('owner can update their client', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id, 'name' => 'Old Name']);

    $response = $this->actingAs($user)->put(route('clients.update', $client), [
        'name' => 'Updated Name',
        'email' => 'updated@acme.com',
        'notes' => 'Updated notes',
    ]);

    $response->assertRedirect(route('clients.show', $client));
    expect($client->fresh()->name)->toBe('Updated Name');
});

test('owner can delete their client and it cascades to projects and tasks', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $project = Project::factory()->create(['client_id' => $client->id]);
    $task = Task::factory()->create(['project_id' => $project->id]);

    $response = $this->actingAs($user)->delete(route('clients.destroy', $client));

    $response->assertRedirect(route('clients.index'));
    expect(Client::find($client->id))->toBeNull()
        ->and(Project::find($project->id))->toBeNull()
        ->and(Task::find($task->id))->toBeNull();
});

test('second user gets 403 when attempting to view another users client', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user1->id]);

    $response = $this->actingAs($user2)->get(route('clients.show', $client));

    $response->assertForbidden();
});

test('second user gets 403 when attempting to update another users client', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user1->id]);

    $response = $this->actingAs($user2)->put(route('clients.update', $client), [
        'name' => 'Malicious Update',
    ]);

    $response->assertForbidden();
});

test('second user gets 403 when attempting to delete another users client', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user1->id]);

    $response = $this->actingAs($user2)->delete(route('clients.destroy', $client));

    $response->assertForbidden();
    expect(Client::find($client->id))->not->toBeNull();
});
