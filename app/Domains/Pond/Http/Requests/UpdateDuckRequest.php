<?php

declare(strict_types=1);

namespace App\Domains\Pond\Http\Requests;

use App\Domains\Pond\Enums\DuckColor;
use App\Domains\Pond\Enums\DuckMood;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates edits to an existing duck. A duck's `quack_count` is deliberately
 * not editable here — it only ever changes through the quack action.
 */
class UpdateDuckRequest extends FormRequest
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
            'pond_id' => ['nullable', 'integer', Rule::exists('ponds', 'id')],
            'color' => ['required', Rule::enum(DuckColor::class)],
            'mood' => ['required', Rule::enum(DuckMood::class)],
            'happiness' => ['required', 'integer', 'between:1,5'],
            'adopted_at' => ['required', 'date'],
            'bio' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
