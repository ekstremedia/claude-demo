<?php

declare(strict_types=1);

use App\Domains\Pond\Enums\DuckColor;
use App\Domains\Pond\Enums\DuckMood;
use App\Domains\Pond\Models\Duck;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

it('increments quack_count by one when it quacks', function () {
    $duck = Duck::factory()->create(['quack_count' => 0]);

    $duck->quack();

    expect($duck->fresh()->quack_count)->toBe(1);
});

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
