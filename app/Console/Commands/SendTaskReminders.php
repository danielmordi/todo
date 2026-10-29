<?php

namespace App\Console\Commands;

use App\Enums\TaskStatus;
use App\Models\Task;
use App\Notifications\Channels\SlackChannel;
use App\Notifications\TaskReminderNotification;
use App\Services\Slack\SlackNotificationService;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Notification;

class SendTaskReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tasks:send-reminders
                            {--dry-run : Display tasks without sending to Slack}
                            {--overdue-only : Only check overdue tasks}
                            {--due-today-only : Only check tasks due today}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send daily task reminders for due and overdue tasks to Slack';

    /**
     * Execute the console command.
     */
    public function handle(SlackNotificationService $slack): int
    {
        $isDryRun = (bool) $this->option('dry-run');
        $overdueOnly = (bool) $this->option('overdue-only');
        $dueTodayOnly = (bool) $this->option('due-today-only');

        /** @var Collection<int, Task> $overdueTasks */
        $overdueTasks = ! $dueTodayOnly
            ? Task::overdue()->with(['project.client'])->orderBy('due_date', 'asc')->get()
            : new Collection;

        /** @var Collection<int, Task> $dueTodayTasks */
        $dueTodayTasks = ! $overdueOnly
            ? Task::dueToday()->where('status', '!=', TaskStatus::Done->value)->with(['project.client'])->orderBy('priority', 'desc')->get()
            : new Collection;

        $overdueCount = $overdueTasks->count();
        $dueTodayCount = $dueTodayTasks->count();
        $totalCount = $overdueCount + $dueTodayCount;

        if ($totalCount === 0) {
            $this->info('No tasks are due today or overdue. No reminder needed.');

            return self::SUCCESS;
        }

        if ($isDryRun) {
            $this->info("Dry run mode enabled: Found {$overdueCount} overdue task(s) and {$dueTodayCount} task(s) due today.");

            if ($overdueCount > 0) {
                $this->line('');
                $this->warn('--- OVERDUE TASKS ---');
                $rows = $overdueTasks->map(fn (Task $t) => [
                    'ID' => $t->id,
                    'Client' => $t->project?->client?->name ?? 'N/A',
                    'Project' => $t->project?->name ?? 'N/A',
                    'Title' => $t->title,
                    'Priority' => $t->priority?->value ?? 'N/A',
                    'Due Date' => $t->due_date?->format('Y-m-d') ?? 'N/A',
                ])->all();
                $this->table(['ID', 'Client', 'Project', 'Title', 'Priority', 'Due Date'], $rows);
            }

            if ($dueTodayCount > 0) {
                $this->line('');
                $this->info('--- TASKS DUE TODAY ---');
                $rows = $dueTodayTasks->map(fn (Task $t) => [
                    'ID' => $t->id,
                    'Client' => $t->project?->client?->name ?? 'N/A',
                    'Project' => $t->project?->name ?? 'N/A',
                    'Title' => $t->title,
                    'Priority' => $t->priority?->value ?? 'N/A',
                    'Due Date' => $t->due_date?->format('Y-m-d') ?? 'N/A',
                ])->all();
                $this->table(['ID', 'Client', 'Project', 'Title', 'Priority', 'Due Date'], $rows);
            }

            return self::SUCCESS;
        }

        if (! $slack->isConfigured()) {
            $this->error('Slack is not configured. Please set SLACK_WEBHOOK_URL or SLACK_BOT_USER_OAUTH_TOKEN in your .env file.');

            return self::FAILURE;
        }

        Notification::route(SlackChannel::class, null)
            ->notify(new TaskReminderNotification($overdueTasks, $dueTodayTasks));

        $this->info("Successfully sent reminder for {$totalCount} task(s) to Slack.");

        return self::SUCCESS;
    }
}
