<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Pond\Models\Duck;
use App\Domains\Pond\Models\Pond;
use Illuminate\Database\Seeder;

/**
 * Fills the pond with a few cheerful, named ponds and a flock of ducks so the
 * app looks alive the moment you open it. Includes a couple of homeless ducks
 * to exercise the "no pond" state and the filters.
 */
class DemoPondSeeder extends Seeder
{
    public function run(): void
    {
        $ponds = [
            'Lily Lagoon' => 'A calm pond carpeted with water lilies.',
            'Splash Bay' => 'Where the rowdiest ducks make the biggest waves.',
            'Mossy Hollow' => 'A shady, secret pond tucked behind the reeds.',
        ];

        foreach ($ponds as $name => $description) {
            $pond = Pond::factory()->create([
                'name' => $name,
                'description' => $description,
            ]);

            Duck::factory()->count(fake()->numberBetween(4, 8))->for($pond)->create();
            Duck::factory()->happy()->for($pond)->create();
            Duck::factory()->grumpy()->for($pond)->create();
        }

        // A few homeless ducks drifting between ponds.
        Duck::factory()->count(3)->create();
    }
}
