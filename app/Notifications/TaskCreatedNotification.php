<?php

namespace App\Notifications;

use App\Enums\TaskPriority;
use App\Models\Task;
use App\Notifications\Channels\SlackChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TaskCreatedNotification extends Notification
{
    use Queueable;

    public function __construct(public Task $task) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, class-string>
     */
    public function via(mixed $notifiable): array
    {
        return [SlackChannel::class];
    }

    /**
     * Get the Slack representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toSlack(mixed $notifiable): array
    {
        $task = $this->task;
        $clientName = $task->project?->client?->name ?? 'No Client';
        $projectName = $task->project?->name ?? 'No Project';

        $priorityBadge = match ($task->priority) {
            TaskPriority::High => '🔴 High',
            TaskPriority::Medium => '🟡 Medium',
            TaskPriority::Low => '🔵 Low',
            default => '⚪ None',
        };

        $dueDate = $task->due_date ? $task->due_date->format('M j, Y') : 'No due date';

        $fallbackText = "New Task: {$task->title} ({$clientName} › {$projectName})";

        $fields = [
            "*Client:*\n{$clientName}",
            "*Project:*\n{$projectName}",
            "*Priority:*\n{$priorityBadge}",
            "*Due Date:*\n{$dueDate}",
        ];

        $fieldBlocks = array_map(fn ($f) => [
            'type' => 'mrkdwn',
            'text' => $f,
        ], $fields);

        $blocks = [
            [
                'type' => 'header',
                'text' => [
                    'type' => 'plain_text',
                    'text' => '📝 New Task Created',
                    'emoji' => true,
                ],
            ],
            [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "*{$task->title}*",
                ],
            ],
            [
                'type' => 'section',
                'fields' => $fieldBlocks,
            ],
        ];

        if (! empty($task->description)) {
            $blocks[] = [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "*Description:*\n{$task->description}",
                ],
            ];
        }

        $appUrl = config('app.url') ? rtrim(config('app.url'), '/') : url('/');
        $tasksUrl = "{$appUrl}/tasks";

        $blocks[] = ['type' => 'divider'];

        $blocks[] = [
            'type' => 'actions',
            'elements' => [
                [
                    'type' => 'button',
                    'text' => [
                        'type' => 'plain_text',
                        'text' => '📋 View Tasks',
                        'emoji' => true,
                    ],
                    'url' => $tasksUrl,
                    'style' => 'primary',
                ],
            ],
        ];

        $blocks[] = [
            'type' => 'context',
            'elements' => [
                [
                    'type' => 'mrkdwn',
                    'text' => 'Freelancer Task Tracker • '.now()->format('D, M j, Y g:i A'),
                ],
            ],
        ];

        return [
            'text' => $fallbackText,
            'blocks' => $blocks,
        ];
    }
}
