<?php

declare(strict_types=1);

namespace App\Domains\Pond\Models;

use Database\Factories\PondFactory;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A pond is home to many ducks.
 *
 * Deleting a pond does NOT delete its ducks — the `ducks.pond_id` foreign key
 * is `nullOnDelete`, so they simply become "homeless" until re-homed.
 *
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Collection<int, Duck> $ducks
 * @property-read int|null $ducks_count
 */
#[UseFactory(PondFactory::class)]
class Pond extends Model
{
    /** @use HasFactory<PondFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = ['name', 'description'];

    /** @return HasMany<Duck, $this> */
    public function ducks(): HasMany
    {
        return $this->hasMany(Duck::class);
    }
}
