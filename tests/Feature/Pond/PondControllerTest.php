<?php

declare(strict_types=1);

use App\Domains\Pond\Models\Duck;
use App\Domains\Pond\Models\Pond;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the pond page with canvas ducks and form options', function () {
    $pond = Pond::factory()->create();
    Duck::factory()->count(2)->for($pond)->create();

    $this->get('/ponds')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Pond/Ponds')
            ->has('ducks', 2)
            ->has('ducks.0.last_fed_adst')
            ->has('ducks.0.created_at')
            ->has('ponds', 1)
            ->where('ponds.0.name', $pond->name)
            ->has('options.colors')
            ->has('options.moods'));
});

it('lazily marks starved ducks as dead when the pond is opened', function () {
    $alive = Duck::factory()->create(['last_fed_at' => now()]);
    $starved = Duck::factory()->create([
        'last_fed_at' => now()->subSeconds(Duck::LIFESPAN_SECONDS + 30),
        'died_at' => null,
    ]);

    $this->get('/ponds')->assertOk();

    expect($alive->fresh()->died_at)->toBeNull();
    expect($starved->fresh()->died_at)->not->toBeNull();
});

it('falls back to created_at when a duck has never been fed', function () {
    $duck = Duck::factory()->create(['last_fed_at' => null]);
    // Backdate creation past the lifespan so the COALESCE anchor starves it.
    $duck->forceFill(['created_at' => now()->subSeconds(Duck::LIFESPAN_SECONDS + 30)])->saveQuietly();

    $this->get('/ponds')->assertOk();

    expect($duck->fresh()->died_at)->not->toBeNull();
});

it('restocks the pond, reviving every duck with a full belly', function () {
    Duck::factory()->create(['died_at' => now(), 'last_fed_at' => now()->subHour()]);
    Duck::factory()->create(['died_at' => null, 'last_fed_at' => now()->subHour()]);

    $this->post('/pond/restock')
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Duck::whereNotNull('died_at')->count())->toBe(0);
    expect(Duck::whereNull('last_fed_at')->count())->toBe(0);
});
