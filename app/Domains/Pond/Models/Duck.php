<?php

declare(strict_types=1);

namespace App\Domains\Pond\Models;

use App\Domains\Pond\Enums\DuckColor;
use App\Domains\Pond\Enums\DuckMood;
use Database\Factories\DuckFactory;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A single rubber duck living in (or wandering between) the ponds.
 *
 * @property int $id
 * @property int|null $pond_id
 * @property string $name
 * @property DuckColor $color
 * @property DuckMood $mood
 * @property int $quack_count
 * @property int $happiness
 * @property Carbon $adopted_at
 * @property string|null $bio
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Pond|null $pond
 */
#[UseFactory(DuckFactory::class)]
class Duck extends Model
{
    /** @use HasFactory<DuckFactory> */
    use HasFactory;

    /**
     * Mass-assignable attributes. Note `quack_count` is intentionally absent:
     * it's a counter only ever changed through {@see Duck::quack()}, never from
     * user input.
     *
     * @var list<string>
     */
    protected $fillable = ['pond_id', 'name', 'color', 'mood', 'happiness', 'adopted_at', 'bio'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'pond_id' => 'integer',
            'color' => DuckColor::class,
            'mood' => DuckMood::class,
            'quack_count' => 'integer',
            'happiness' => 'integer',
            'adopted_at' => 'date',
        ];
    }

    /** @return BelongsTo<Pond, $this> */
    public function pond(): BelongsTo
    {
        return $this->belongsTo(Pond::class);
    }

    /**
     * Give this duck a squeeze — bump its lifetime quack tally by one.
     * Uses an atomic increment so concurrent quacks never lose a count.
     */
    public function quack(): void
    {
        $this->increment('quack_count');
    }
}
