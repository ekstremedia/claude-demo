<?php

declare(strict_types=1);

namespace App\Domains\Pond\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates edits to an existing pond.
 */
class UpdatePondRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Demo app — no authentication or authorization gate.
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
