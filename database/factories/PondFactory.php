<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domains\Pond\Models\Pond;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pond>
 */
class PondFactory extends Factory
{
    protected $model = Pond::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => ucfirst(fake()->word()).' Pond',
            'description' => fake()->boolean(70) ? fake()->sentence() : null,
        ];
    }
}
