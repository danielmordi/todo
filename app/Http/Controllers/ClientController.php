<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Models\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Client::class);

        $clients = $request->user()->clients()
            ->withCount([
                'projects',
                'tasks',
                'tasks as done_tasks_count' => function ($query) {
                    $query->where('tasks.status', TaskStatus::Done->value);
                },
            ])
            ->latest()
            ->get();

        return Inertia::render('clients/index', [
            'clients' => $clients,
        ]);
    }

    public function show(Client $client): Response
    {
        Gate::authorize('view', $client);

        $client->load([
            'projects' => function ($query) {
                $query->withCount([
                    'tasks',
                    'tasks as done_tasks_count' => function ($q) {
                        $q->where('tasks.status', TaskStatus::Done->value);
                    },
                ])->latest();
            },
        ]);

        return Inertia::render('clients/show', [
            'client' => $client,
        ]);
    }

    public function store(StoreClientRequest $request): RedirectResponse
    {
        Gate::authorize('create', Client::class);

        $client = $request->user()->clients()->create($request->validated());

        return redirect()->route('clients.show', $client);
    }

    public function update(UpdateClientRequest $request, Client $client): RedirectResponse
    {
        Gate::authorize('update', $client);

        $client->update($request->validated());

        return redirect()->route('clients.show', $client);
    }

    public function destroy(Client $client): RedirectResponse
    {
        Gate::authorize('delete', $client);

        $client->delete();

        return redirect()->route('clients.index');
    }
}
