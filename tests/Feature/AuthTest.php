<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('guests are redirected from root to login', function () {
    $response = $this->get('/');

    $response->assertRedirect(route('login'));
});

test('authenticated users are redirected from root to dashboard', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/');

    $response->assertRedirect(route('dashboard'));
});

test('registration route returns 404', function () {
    $response = $this->get('/register');

    $response->assertNotFound();
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create([
        'email' => 'freelancer@example.com',
        'password' => Hash::make('password123'),
    ]);

    $response = $this->post(route('login.store'), [
        'email' => 'freelancer@example.com',
        'password' => 'password123',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard'));
});

test('users cannot authenticate with invalid password', function () {
    $user = User::factory()->create([
        'email' => 'freelancer@example.com',
        'password' => Hash::make('password123'),
    ]);

    $response = $this->post(route('login.store'), [
        'email' => 'freelancer@example.com',
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors('email');
});

test('users can log out', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('logout'));

    $this->assertGuest();
    $response->assertRedirect(route('login'));
});

test('artisan command app:create-user creates a new user', function () {
    $this->artisan('app:create-user', [
        'name' => 'Jane Developer',
        'email' => 'jane@example.com',
    ])
        ->expectsQuestion('Password', 'securepassword123')
        ->assertSuccessful();

    $user = User::where('email', 'jane@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->name)->toBe('Jane Developer')
        ->and(Hash::check('securepassword123', $user->password))->toBeTrue();
});
