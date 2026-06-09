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
 * @property Carbon $adopted_at
 * @property string|null $bio
 * @property Carbon|null $last_fed_at
 * @property Carbon|null $died_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Pond|null $pond
 */
#[UseFactory(DuckFactory::class)]
class Duck extends Model
{
    /** @use HasFactory<DuckFactory> */
    use HasFactory;

    /** Seconds a duck may go unfed before it starves — the single survival tunable. */
    public const int LIFESPAN_SECONDS = 60;

    /** @var list<string> */
    protected $fillable = ['pond_id', 'name', 'color', 'mood', 'adopted_at', 'bio', 'last_fed_at', 'died_at'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'pond_id' => 'integer',
            'color' => DuckColor::class,
            'mood' => DuckMood::class,
            'adopted_at' => 'date',
            'last_fed_at' => 'datetime',
            'died_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Pond, $this> */
    public function pond(): BelongsTo
    {
        return $this->belongsTo(Pond::class);
    }
}
