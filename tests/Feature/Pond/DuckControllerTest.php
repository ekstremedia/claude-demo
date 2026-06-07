<?php

declare(strict_types=1);

use App\Domains\Pond\Enums\DuckColor;
use App\Domains\Pond\Enums\DuckMood;
use App\Domains\Pond\Models\Duck;
use App\Domains\Pond\Models\Pond;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the pond index with ducks, stats and options', function () {
    Duck::factory()->count(3)->create();

    $this->get('/pond')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Pond/Index')
            ->has('ducks.data', 3)
            ->has('stats')
            ->has('options.colors')
            ->has('options.moods'));
});

it('adopts a duck from valid input', function () {
    $pond = Pond::factory()->create();

    $this->post('/ducks', [
        'name' => 'Sir Quacks',
        'pond_id' => $pond->id,
        'color' => DuckColor::Yellow->value,
        'mood' => DuckMood::Happy->value,
        'happiness' => 5,
        'adopted_at' => '2026-01-01',
        'bio' => 'A very happy duck.',
    ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Duck::where('name', 'Sir Quacks')->where('pond_id', $pond->id)->exists())->toBeTrue();
});

it('lets a duck be homeless (null pond)', function () {
    $this->post('/ducks', [
        'name' => 'Wanderer',
        'pond_id' => null,
        'color' => DuckColor::White->value,
        'mood' => DuckMood::Zen->value,
        'happiness' => 3,
        'adopted_at' => '2026-01-01',
    ])->assertRedirect();

    expect(Duck::firstWhere('name', 'Wanderer')->pond_id)->toBeNull();
});

it('rejects invalid input', function (array $payload, string $errorField) {
    $this->post('/ducks', $payload)->assertSessionHasErrors($errorField);
})->with([
    'invalid colour' => [['name' => 'X', 'color' => 'rainbow', 'mood' => 'happy', 'happiness' => 3, 'adopted_at' => '2026-01-01'], 'color'],
    'invalid mood' => [['name' => 'X', 'color' => 'yellow', 'mood' => 'hangry', 'happiness' => 3, 'adopted_at' => '2026-01-01'], 'mood'],
    'happiness too high' => [['name' => 'X', 'color' => 'yellow', 'mood' => 'happy', 'happiness' => 6, 'adopted_at' => '2026-01-01'], 'happiness'],
    'missing name' => [['color' => 'yellow', 'mood' => 'happy', 'happiness' => 3, 'adopted_at' => '2026-01-01'], 'name'],
    'non-existent pond' => [['name' => 'X', 'pond_id' => 999, 'color' => 'yellow', 'mood' => 'happy', 'happiness' => 3, 'adopted_at' => '2026-01-01'], 'pond_id'],
]);

it('updates a duck', function () {
    $duck = Duck::factory()->create(['name' => 'Old Name']);

    $this->put("/ducks/{$duck->id}", [
        'name' => 'New Name',
        'pond_id' => null,
        'color' => DuckColor::Blue->value,
        'mood' => DuckMood::Zen->value,
        'happiness' => 2,
        'adopted_at' => '2026-02-02',
    ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($duck->fresh())
        ->name->toBe('New Name')
        ->color->toBe(DuckColor::Blue)
        ->mood->toBe(DuckMood::Zen);
});

it('releases (deletes) a duck', function () {
    $duck = Duck::factory()->create();

    $this->delete("/ducks/{$duck->id}")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Duck::find($duck->id))->toBeNull();
});

it('increments quack_count via the quack action', function () {
    $duck = Duck::factory()->create(['quack_count' => 4]);

    $this->post("/ducks/{$duck->id}/quack")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($duck->fresh()->quack_count)->toBe(5);
});

it('filters ducks by search, mood and colour', function () {
    Duck::factory()->create(['name' => 'Findme', 'mood' => DuckMood::Zen, 'color' => DuckColor::Blue]);
    Duck::factory()->create(['name' => 'Other', 'mood' => DuckMood::Grumpy, 'color' => DuckColor::Pink]);

    $query = http_build_query(['search' => 'find', 'mood' => 'zen', 'color' => 'blue']);

    $this->get("/pond?{$query}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('ducks.data', 1)
            ->where('ducks.data.0.name', 'Findme'));
});
