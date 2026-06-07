<?php

declare(strict_types=1);

namespace App\Domains\Pond\Http\Controllers;

use App\Domains\Pond\Enums\DuckColor;
use App\Domains\Pond\Enums\DuckMood;
use App\Domains\Pond\Http\Requests\StoreDuckRequest;
use App\Domains\Pond\Http\Requests\UpdateDuckRequest;
use App\Domains\Pond\Models\Duck;
use App\Domains\Pond\Models\Pond;
use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The heart of the pond: lists ducks with search/filter/stats, and handles
 * adopting, editing, releasing and — of course — quacking.
 */
class DuckController extends Controller
{
    /** Ducks shown per page on the index. */
    private const int PER_PAGE = 12;

    /**
     * The pond index: a searchable, filterable, paginated grid of ducks plus
     * the headline stats and the option lists the create/edit form needs.
     */
    public function index(Request $request): Response
    {
        // SQLite (tests) does case-insensitive LIKE for ASCII out of the box;
        // Postgres (prod) needs ILIKE for the same behaviour.
        $likeOperator = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';

        $search = (string) $request->string('search')->trim();
        $mood = $request->enum('mood', DuckMood::class)?->value;
        $color = $request->enum('color', DuckColor::class)?->value;

        $ducks = Duck::query()
            ->with('pond:id,name')
            ->when($search !== '', fn (Builder $query) => $query->where(
                'name',
                $likeOperator,
                '%'.addcslashes($search, '%_\\').'%',
            ))
            ->when($mood, fn (Builder $query) => $query->where('mood', $mood))
            ->when($color, fn (Builder $query) => $query->where('color', $color))
            ->latest()
            ->paginate(self::PER_PAGE)
            ->withQueryString()
            ->through(fn (Duck $duck) => $this->presentDuck($duck));

        return Inertia::render('Pond/Index', [
            'ducks' => $ducks,
            'ponds' => Pond::query()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'mood' => $mood,
                'color' => $color,
            ],
            'options' => [
                'colors' => DuckColor::options(),
                'moods' => DuckMood::options(),
            ],
            'stats' => $this->stats(),
        ]);
    }

    /** Adopt a new duck into the pond. */
    public function store(StoreDuckRequest $request): RedirectResponse
    {
        $duck = Duck::create($request->validated());

        return back()->with('success', "🐣 {$duck->name} has joined the pond!");
    }

    /** Update an existing duck's details. */
    public function update(UpdateDuckRequest $request, Duck $duck): RedirectResponse
    {
        $duck->update($request->validated());

        return back()->with('success', "✏️ {$duck->name} was updated.");
    }

    /** Release a duck back into the wild. */
    public function destroy(Duck $duck): RedirectResponse
    {
        $name = $duck->name;
        $duck->delete();

        return back()->with('success', "👋 {$name} waddled off.");
    }

    /** Give a duck a squeeze — increment its lifetime quack tally. */
    public function quack(Duck $duck): RedirectResponse
    {
        $duck->quack();

        return back()->with('success', "🦆 {$duck->name} says QUACK! ({$duck->quack_count} total)");
    }

    /**
     * Shape a duck for the frontend: enums become {value,label,…} objects so the
     * Vue side never depends on PHP enum serialization, and dates are ISO strings.
     *
     * @return array{
     *     id: int,
     *     name: string,
     *     pond: array{id: int, name: string}|null,
     *     color: array{value: string, label: string, hex: string},
     *     mood: array{value: string, label: string, emoji: string},
     *     quack_count: int,
     *     happiness: int,
     *     adopted_at: string,
     *     bio: string|null,
     * }
     */
    private function presentDuck(Duck $duck): array
    {
        return [
            'id' => $duck->id,
            'name' => $duck->name,
            'pond' => $duck->pond === null
                ? null
                : ['id' => $duck->pond->id, 'name' => $duck->pond->name],
            'color' => $duck->color->toArray(),
            'mood' => $duck->mood->toArray(),
            'quack_count' => $duck->quack_count,
            'happiness' => $duck->happiness,
            'adopted_at' => $duck->adopted_at->toDateString(),
            'bio' => $duck->bio,
        ];
    }

    /**
     * Headline numbers for the stats bar above the grid.
     *
     * @return array{total_ducks: int, total_ponds: int, total_quacks: int, by_mood: array<string, int>}
     */
    private function stats(): array
    {
        return [
            'total_ducks' => Duck::count(),
            'total_ponds' => Pond::count(),
            'total_quacks' => (int) Duck::sum('quack_count'),
            'by_mood' => Duck::query()
                ->selectRaw('mood, COUNT(*) as aggregate')
                ->groupBy('mood')
                ->pluck('aggregate', 'mood')
                ->map(fn (int|string $count): int => (int) $count)
                ->all(),
        ];
    }
}
