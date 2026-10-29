<?php

namespace Database\Factories;

use App\Enums\ProjectStatus;
use App\Models\Client;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'client_id' => Client::factory(),
            'name' => fake()->catchPhrase(),
            'status' => fake()->randomElement(ProjectStatus::cases())->value,
            'deadline' => fake()->optional(0.7)->dateTimeBetween('now', '+3 months')?->format('Y-m-d'),
            'budget_hours' => fake()->optional(0.7)->randomFloat(2, 10, 120),
        ];
    }
}
