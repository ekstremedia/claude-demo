<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domains\Pond\Enums\DuckColor;
use App\Domains\Pond\Enums\DuckMood;
use App\Domains\Pond\Models\Duck;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Duck>
 */
class DuckFactory extends Factory
{
    protected $model = Duck::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'pond_id' => null, // assigned explicitly via ->for($pond) when needed
            'name' => fake()->firstName().' the Duck',
            'color' => fake()->randomElement(DuckColor::cases()),
            'mood' => fake()->randomElement(DuckMood::cases()),
            'quack_count' => fake()->numberBetween(0, 200),
            'happiness' => fake()->numberBetween(1, 5),
            'adopted_at' => fake()->dateTimeBetween('-2 years', 'now'),
            'bio' => fake()->boolean(60) ? fake()->sentence() : null,
        ];
    }

    /** A cheerful duck on top of the world. */
    public function happy(): static
    {
        return $this->state(fn (): array => [
            'mood' => DuckMood::Happy,
            'happiness' => 5,
        ]);
    }

    /** A duck who woke up on the wrong side of the pond. */
    public function grumpy(): static
    {
        return $this->state(fn (): array => [
            'mood' => DuckMood::Grumpy,
            'happiness' => 1,
        ]);
    }
}
