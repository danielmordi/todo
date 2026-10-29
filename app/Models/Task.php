<?php

namespace App\Models;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'status',
        'priority',
        'due_date',
        'estimated_hours',
        'completed_at',
    ];

    protected $appends = [
        'is_overdue',
    ];

    protected function casts(): array
    {
        return [
            'status' => TaskStatus::class,
            'priority' => TaskPriority::class,
            'due_date' => 'date',
            'estimated_hours' => 'decimal:2',
            'completed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Task $task) {
            if ($task->isDirty('status')) {
                if ($task->status === TaskStatus::Done) {
                    $task->completed_at = $task->completed_at ?? now();
                } else {
                    $task->completed_at = null;
                }
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function getIsOverdueAttribute(): bool
    {
        if (! $this->due_date || $this->status === TaskStatus::Done) {
            return false;
        }

        $today = now(config('app.timezone'))->toDateString();

        return $this->due_date->format('Y-m-d') < $today;
    }

    public function scopeOverdue(Builder $query): Builder
    {
        $today = now(config('app.timezone'))->toDateString();

        return $query->where('status', '!=', TaskStatus::Done->value)
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', $today);
    }

    public function scopeDueToday(Builder $query): Builder
    {
        $today = now(config('app.timezone'))->toDateString();

        return $query->whereDate('due_date', '=', $today);
    }
}
