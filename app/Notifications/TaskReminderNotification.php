<?php

namespace App\Notifications;

use App\Enums\TaskPriority;
use App\Models\Task;
use App\Notifications\Channels\SlackChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Notifications\Notification;

class TaskReminderNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     *
     * @param  Collection<int, Task>  $overdueTasks
     * @param  Collection<int, Task>  $dueTodayTasks
     */
    public function __construct(
        public Collection $overdueTasks,
        public Collection $dueTodayTasks
    ) {}

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
        $overdueCount = $this->overdueTasks->count();
        $dueTodayCount = $this->dueTodayTasks->count();

        $summaryParts = [];
        if ($overdueCount > 0) {
            $summaryParts[] = "🚨 *{$overdueCount} overdue*";
        }
        if ($dueTodayCount > 0) {
            $summaryParts[] = "📅 *{$dueTodayCount} due today*";
        }
        $summaryLine = implode('  •  ', $summaryParts);

        $fallbackText = "Task Reminder: {$overdueCount} overdue, {$dueTodayCount} due today.";

        $blocks = [
            [
                'type' => 'header',
                'text' => [
                    'type' => 'plain_text',
                    'text' => '⏰ Task Reminders',
                    'emoji' => true,
                ],
            ],
            [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "Here is your morning task summary:\n{$summaryLine}",
                ],
            ],
            [
                'type' => 'divider',
            ],
        ];

        if ($overdueCount > 0) {
            $blocks[] = [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "*🚨 OVERDUE TASKS ({$overdueCount})*",
                ],
            ];

            foreach ($this->overdueTasks->take(10) as $task) {
                $blocks[] = [
                    'type' => 'section',
                    'text' => [
                        'type' => 'mrkdwn',
                        'text' => $this->formatTaskLine($task, true),
                    ],
                ];
            }

            if ($overdueCount > 10) {
                $remaining = $overdueCount - 10;
                $blocks[] = [
                    'type' => 'context',
                    'elements' => [
                        [
                            'type' => 'mrkdwn',
                            'text' => "_...and {$remaining} more overdue tasks._",
                        ],
                    ],
                ];
            }
        }

        if ($dueTodayCount > 0) {
            if ($overdueCount > 0) {
                $blocks[] = ['type' => 'divider'];
            }

            $blocks[] = [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "*📅 DUE TODAY ({$dueTodayCount})*",
                ],
            ];

            foreach ($this->dueTodayTasks->take(10) as $task) {
                $blocks[] = [
                    'type' => 'section',
                    'text' => [
                        'type' => 'mrkdwn',
                        'text' => $this->formatTaskLine($task, false),
                    ],
                ];
            }

            if ($dueTodayCount > 10) {
                $remaining = $dueTodayCount - 10;
                $blocks[] = [
                    'type' => 'context',
                    'elements' => [
                        [
                            'type' => 'mrkdwn',
                            'text' => "_...and {$remaining} more tasks due today._",
                        ],
                    ],
                ];
            }
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
                        'text' => '📋 View Tasks in Dashboard',
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

    /**
     * Format a single task row for Slack.
     */
    protected function formatTaskLine(Task $task, bool $showDueDate): string
    {
        $clientName = $task->project?->client?->name ?? 'No Client';
        $projectName = $task->project?->name ?? 'No Project';

        $priorityBadge = match ($task->priority) {
            TaskPriority::High => '🔴 *High*',
            TaskPriority::Medium => '🟡 *Medium*',
            TaskPriority::Low => '🔵 *Low*',
            default => '⚪ *None*',
        };

        $dueDateStr = $task->due_date ? $task->due_date->format('M j') : 'No date';

        $meta = "_{$clientName} › {$projectName}_ | Priority: {$priorityBadge}";
        if ($showDueDate) {
            $meta .= " | Due: *{$dueDateStr}*";
        }

        return "• *{$task->title}*\n   {$meta}";
    }
}
