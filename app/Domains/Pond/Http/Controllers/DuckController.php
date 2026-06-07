<?php

declare(strict_types=1);

namespace App\Domains\Pond\Http\Controllers;

use App\Domains\Pond\Enums\DuckColor;
use App\Domains\Pond\Enums\DuckMood;
use App\Domains\Pond\Http\Requests\StoreDuckRequest;
use App\Domains\Pond\Http\Requests\UpdateDuckRequest;
use App\Domains\Pond\Http\Resources\DuckResource;
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
 * adopting, editing and releasing them.
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
            ->through(fn (Duck $duck) => (new DuckResource($duck))->resolve());

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

    /**
     * Feed a batch of ducks (the ones that just ate breadcrumbs in the pond),
     * refilling their life. Already-dead ducks can't be fed.
     */
    public function feed(Request $request): RedirectResponse
    {
        Duck::query()->whereIn('id', $this->validatedDuckIds($request))->whereNull('died_at')->update(['last_fed_at' => now()]);

        return back();
    }

    /** Record a batch of ducks that have starved to death. */
    public function bury(Request $request): RedirectResponse
    {
        Duck::query()->whereIn('id', $this->validatedDuckIds($request))->whereNull('died_at')->update(['died_at' => now()]);

        return back();
    }

    /**
     * @return list<int>
     */
    private function validatedDuckIds(Request $request): array
    {
        /** @var list<int> $ids */
        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:ducks,id'],
        ])['ids'];

        return $ids;
    }

    /**
     * Headline numbers for the stats bar above the grid.
     *
     * @return array{total_ducks: int, total_ponds: int, by_mood: array<string, int>}
     */
    private function stats(): array
    {
        return [
            'total_ducks' => Duck::count(),
            'total_ponds' => Pond::count(),
            'by_mood' => Duck::query()
                ->selectRaw('mood, COUNT(*) as aggregate')
                ->groupBy('mood')
                ->pluck('aggregate', 'mood')
                ->map(fn (int|string $count): int => (int) $count)
                ->all(),
        ];
    }
}
