<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function show(Project $project): Response
    {
        Gate::authorize('view', $project);

        $project->load([
            'client',
            'tasks' => function ($query) {
                $query->orderBy('due_date', 'asc')
                    ->orderBy('priority', 'desc');
            },
        ]);

        return Inertia::render('projects/show', [
            'project' => $project,
        ]);
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        Gate::authorize('create', Project::class);

        $project = Project::create($request->validated());

        return redirect()->route('projects.show', $project);
    }

    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        Gate::authorize('update', $project);

        $project->update($request->validated());

        return redirect()->route('projects.show', $project);
    }

    public function destroy(Project $project): RedirectResponse
    {
        Gate::authorize('delete', $project);

        $clientId = $project->client_id;
        $project->delete();

        return redirect()->route('clients.show', $clientId);
    }
}
