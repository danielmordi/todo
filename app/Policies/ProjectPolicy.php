<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Project $project): bool
    {
        return $project->client->user_id === $user->id;
    }

    public function create(User $user, ?Client $client = null): bool
    {
        if ($client) {
            return $client->user_id === $user->id;
        }

        return true;
    }

    public function update(User $user, Project $project): bool
    {
        return $project->client->user_id === $user->id;
    }

    public function delete(User $user, Project $project): bool
    {
        return $project->client->user_id === $user->id;
    }
}
