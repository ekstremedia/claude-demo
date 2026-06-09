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
        'adopted_at' => '2026-01-01',
    ])->assertRedirect();

    expect(Duck::firstWhere('name', 'Wanderer')->pond_id)->toBeNull();
});

it('rejects invalid input', function (array $payload, string $errorField) {
    $this->post('/ducks', $payload)->assertSessionHasErrors($errorField);
})->with([
    'invalid colour' => [['name' => 'X', 'color' => 'rainbow', 'mood' => 'happy', 'adopted_at' => '2026-01-01'], 'color'],
    'invalid mood' => [['name' => 'X', 'color' => 'yellow', 'mood' => 'hangry', 'adopted_at' => '2026-01-01'], 'mood'],
    'missing name' => [['color' => 'yellow', 'mood' => 'happy', 'adopted_at' => '2026-01-01'], 'name'],
    'non-existent pond' => [['name' => 'X', 'pond_id' => 999, 'color' => 'yellow', 'mood' => 'happy', 'adopted_at' => '2026-01-01'], 'pond_id'],
]);

it('updates a duck', function () {
    $duck = Duck::factory()->create(['name' => 'Old Name']);

    $this->put("/ducks/{$duck->id}", [
        'name' => 'New Name',
        'pond_id' => null,
        'color' => DuckColor::Blue->value,
        'mood' => DuckMood::Zen->value,
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

it('feeds a batch of ducks, refilling last_fed_at', function () {
    // Freeze time (to a whole second, matching the timestamp column's precision)
    // so we can assert exact equality rather than a flaky now()-window comparison.
    $now = now()->startOfSecond();
    $this->travelTo($now);

    $hungry = Duck::factory()->create(['last_fed_at' => $now->copy()->subHour()]);
    $other = Duck::factory()->create(['last_fed_at' => $now->copy()->subHour()]);

    $this->post('/ducks/feed', ['ids' => [$hungry->id, $other->id]])->assertRedirect();

    expect($hungry->fresh()->last_fed_at?->equalTo($now))->toBeTrue();
    expect($other->fresh()->last_fed_at?->equalTo($now))->toBeTrue();

    $this->travelBack();
});

it('does not feed a duck that has already died', function () {
    $deadAt = now()->subMinutes(5);
    $dead = Duck::factory()->create(['died_at' => $deadAt, 'last_fed_at' => now()->subHour()]);

    $this->post('/ducks/feed', ['ids' => [$dead->id]])->assertRedirect();

    // Still dead, and its feeding timestamp was left untouched.
    expect($dead->fresh()->died_at)->not->toBeNull()
        ->and($dead->fresh()->last_fed_at->diffInSeconds(now()))->toBeGreaterThan(60);
});

it('buries a batch of starved ducks by stamping died_at', function () {
    $a = Duck::factory()->create(['died_at' => null]);
    $b = Duck::factory()->create(['died_at' => null]);

    $this->post('/ducks/die', ['ids' => [$a->id, $b->id]])->assertRedirect();

    expect($a->fresh()->died_at)->not->toBeNull();
    expect($b->fresh()->died_at)->not->toBeNull();
});

it('does not overwrite the death time of an already-dead duck', function () {
    $original = now()->subMinutes(10);
    $dead = Duck::factory()->create(['died_at' => $original]);

    $this->post('/ducks/die', ['ids' => [$dead->id]])->assertRedirect();

    expect($dead->fresh()->died_at->diffInSeconds($original))->toBeLessThan(2);
});

it('validates the duck ids on feed and die', function (string $route) {
    $this->post($route, ['ids' => 'nope'])->assertSessionHasErrors('ids');
    $this->post($route, ['ids' => [999999]])->assertSessionHasErrors('ids.0');
})->with(['/ducks/feed', '/ducks/die']);

it('hatches a duckling into the parent pond', function () {
    $pond = Pond::factory()->create();
    $parent = Duck::factory()->for($pond)->create();

    $this->post('/ducks/hatch', ['parent_id' => $parent->id])->assertRedirect();

    expect(Duck::count())->toBe(2)
        ->and(Duck::query()->where('pond_id', $pond->id)->count())->toBe(2);
});

it('does not breed past the flock cap', function () {
    Duck::factory()->count(16)->create(); // FLOCK_CAP living ducks

    $this->post('/ducks/hatch')->assertRedirect();

    expect(Duck::whereNull('died_at')->count())->toBe(16);
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
