<?php

namespace Database\Factories;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        $status = fake()->randomElement(TaskStatus::cases());

        return [
            'project_id' => Project::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->optional(0.7)->paragraph(),
            'status' => $status->value,
            'priority' => fake()->randomElement(TaskPriority::cases())->value,
            'due_date' => fake()->optional(0.8)->dateTimeBetween('-2 weeks', '+4 weeks')?->format('Y-m-d'),
            'estimated_hours' => fake()->optional(0.7)->randomFloat(2, 1, 20),
            'completed_at' => $status === TaskStatus::Done ? now() : null,
        ];
    }
}
