<?php

namespace App\Http\Requests;

use App\Enums\ProjectStatus;
use App\Models\Client;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        $clientId = $this->input('client_id');
        if (! $clientId) {
            return false;
        }

        $client = Client::find($clientId);

        return $client && $this->user()->can('view', $client);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', Rule::enum(ProjectStatus::class)],
            'deadline' => ['nullable', 'date'],
            'budget_hours' => ['nullable', 'numeric', 'between:0,9999.99'],
        ];
    }
}
