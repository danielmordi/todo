<?php

namespace App\Notifications\Channels;

use App\Services\Slack\SlackNotificationService;
use Illuminate\Notifications\Notification;

class SlackChannel
{
    public function __construct(protected SlackNotificationService $slack) {}

    /**
     * Send the given notification.
     */
    public function send(mixed $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toSlack')) {
            return;
        }

        $payload = $notification->toSlack($notifiable);

        if (! empty($payload)) {
            $this->slack->send($payload);
        }
    }
}
