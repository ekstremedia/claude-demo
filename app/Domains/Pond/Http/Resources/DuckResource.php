<?php

declare(strict_types=1);

namespace App\Domains\Pond\Http\Resources;

use App\Domains\Pond\Models\Duck;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The shared wire-shape for a duck: enums become {value,label,…} objects so the
 * Vue side never depends on PHP enum serialization, and dates are ISO strings.
 * Used by both the duck index and the pond canvas.
 *
 * @mixin Duck
 */
class DuckResource extends JsonResource
{
    /**
     * @return array{
     *     id: int,
     *     name: string,
     *     pond: array{id: int, name: string}|null,
     *     color: array{value: string, label: string, hex: string},
     *     mood: array{value: string, label: string, emoji: string},
     *     adopted_at: string,
     *     bio: string|null,
     *     created_at: string,
     *     last_fed_at: string|null,
     *     died_at: string|null,
     * }
     */
    public function toArray(Request $request): array
    {
        /** @var Duck $duck */
        $duck = $this->resource;

        return [
            'id' => $duck->id,
            'name' => $duck->name,
            'pond' => $duck->pond === null
                ? null
                : ['id' => $duck->pond->id, 'name' => $duck->pond->name],
            'color' => $duck->color->toArray(),
            'mood' => $duck->mood->toArray(),
            'adopted_at' => $duck->adopted_at->toDateString(),
            'bio' => $duck->bio,
            // Survival anchors: the canvas computes a 0..1 life from these.
            'created_at' => $duck->created_at->toIso8601String(),
            'last_fed_at' => $duck->last_fed_at?->toIso8601String(),
            'died_at' => $duck->died_at?->toIso8601String(),
        ];
    }
}
