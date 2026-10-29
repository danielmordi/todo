<?php

use App\Models\TeamInvitation;
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    TeamInvitation::query()
        ->whereNotNull('expires_at')
        ->where('expires_at', '<', now())
        ->delete();
})->daily()->description('Delete expired team invitations');

$reminderSchedule = Schedule::command('tasks:send-reminders')
    ->timezone(config('app.timezone', 'UTC'))
    ->withoutOverlapping()
    ->description('Send Slack reminders for due and overdue tasks');

if (config('services.slack.notifications.reminder_days') === 'weekdays') {
    $reminderSchedule->weekdays()->at(config('services.slack.notifications.reminder_time', '09:00'));
} else {
    $reminderSchedule->dailyAt(config('services.slack.notifications.reminder_time', '09:00'));
}
