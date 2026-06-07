<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Pond\Models\Duck;
use App\Domains\Pond\Models\Pond;
use Illuminate\Database\Seeder;

/**
 * One little pond, a small flock of well-fed ducks — enough to make the pond
 * feel alive the moment you open it, calm enough not to feel crowded.
 */
class DemoPondSeeder extends Seeder
{
    public function run(): void
    {
        $pond = Pond::factory()->create([
            'name' => 'The Pond',
            'description' => 'One little pond, eight hungry ducks. Keep them fed.',
        ]);

        Duck::factory()->count(8)->for($pond)->create();
    }
}
