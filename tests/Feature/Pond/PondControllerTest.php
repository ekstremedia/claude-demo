<?php

declare(strict_types=1);

use App\Domains\Pond\Models\Duck;
use App\Domains\Pond\Models\Pond;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the ponds index with duck counts', function () {
    $pond = Pond::factory()->create();
    Duck::factory()->count(2)->for($pond)->create();

    $this->get('/ponds')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Pond/Ponds')
            ->has('ponds', 1)
            ->where('ponds.0.ducks_count', 2));
});

it('digs a new pond', function () {
    $this->post('/ponds', ['name' => 'New Pond', 'description' => 'A lovely spot.'])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Pond::where('name', 'New Pond')->exists())->toBeTrue();
});

it('updates a pond', function () {
    $pond = Pond::factory()->create(['name' => 'Old']);

    $this->put("/ponds/{$pond->id}", ['name' => 'Renamed', 'description' => null])
        ->assertRedirect();

    expect($pond->fresh()->name)->toBe('Renamed');
});

it('validates that a pond name is required', function () {
    $this->post('/ponds', ['name' => ''])->assertSessionHasErrors('name');
});

it('draining a pond leaves its ducks homeless, not deleted', function () {
    $pond = Pond::factory()->create();
    $duck = Duck::factory()->for($pond)->create();

    $this->delete("/ponds/{$pond->id}")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Pond::find($pond->id))->toBeNull();
    expect($duck->fresh())->not->toBeNull()
        ->and($duck->fresh()->pond_id)->toBeNull();
});
