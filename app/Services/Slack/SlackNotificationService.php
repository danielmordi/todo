<?php

namespace App\Services\Slack;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SlackNotificationService
{
    /**
     * Determine if Slack notifications are configured.
     */
    public function isConfigured(): bool
    {
        return ! empty($this->webhookUrl()) || (! empty($this->botToken()) && ! empty($this->channel()));
    }

    /**
     * Get the configured Slack Webhook URL.
     */
    public function webhookUrl(): ?string
    {
        return config('services.slack.notifications.webhook_url');
    }

    /**
     * Get the configured Slack Bot User OAuth Token.
     */
    public function botToken(): ?string
    {
        return config('services.slack.notifications.bot_user_oauth_token');
    }

    /**
     * Get the default Slack channel.
     */
    public function channel(): ?string
    {
        return config('services.slack.notifications.channel');
    }

    /**
     * Send a Slack message payload.
     *
     * @param  array<string, mixed>  $payload
     */
    public function send(array $payload): bool
    {
        if (! $this->isConfigured()) {
            Log::warning('Slack notification not sent: Slack is not configured.');

            return false;
        }

        try {
            if ($webhookUrl = $this->webhookUrl()) {
                $response = Http::timeout(10)->post($webhookUrl, $payload);
            } else {
                $botToken = $this->botToken();
                $channel = $this->channel();

                $body = array_merge($payload, ['channel' => $channel]);
                $response = Http::withToken($botToken)
                    ->timeout(10)
                    ->post('https://slack.com/api/chat.postMessage', $body);
            }

            if (! $response->successful()) {
                Log::error('Failed to send Slack notification', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('Exception while sending Slack notification: '.$e->getMessage(), [
                'exception' => $e,
            ]);

            return false;
        }
    }
}
