<?php

declare(strict_types=1);

use App\Domains\Pond\Enums\DuckColor;
use App\Domains\Pond\Enums\DuckMood;
use App\Domains\Pond\Models\Duck;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

it('casts colour and mood to their enums', function () {
    $duck = Duck::factory()->create([
        'color' => DuckColor::Pink,
        'mood' => DuckMood::Sleepy,
    ]);

    expect($duck->fresh())
        ->color->toBeInstanceOf(DuckColor::class)
        ->mood->toBeInstanceOf(DuckMood::class);
});

it('belongs to a pond relationship', function () {
    $duck = Duck::factory()->create();

    expect($duck->pond())->toBeInstanceOf(BelongsTo::class);
});
