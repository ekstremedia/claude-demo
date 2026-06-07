<?php

declare(strict_types=1);

namespace App\Domains\Pond\Http\Controllers;

use App\Domains\Pond\Enums\DuckColor;
use App\Domains\Pond\Enums\DuckMood;
use App\Domains\Pond\Http\Resources\DuckResource;
use App\Domains\Pond\Models\Duck;
use App\Domains\Pond\Models\Pond;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The pond — a little survival game. Renders every duck on the canvas (where you
 * feed them to keep them alive) and restocks the pond when it goes quiet.
 */
class PondController extends Controller
{
    /** The pond page: every duck (with survival timestamps) plus the edit-form options. */
    public function index(): Response
    {
        $this->reapStarvedDucks();

        return Inertia::render('Pond/Ponds', [
            'ducks' => Duck::query()
                ->with('pond:id,name')
                ->orderBy('name')
                ->get()
                ->map(fn (Duck $duck) => (new DuckResource($duck))->resolve()),
            'ponds' => Pond::query()->orderBy('name')->get(['id', 'name']),
            'options' => [
                'colors' => DuckColor::options(),
                'moods' => DuckMood::options(),
            ],
        ]);
    }

    /** Bring every duck back to life with a full belly. */
    public function restock(): RedirectResponse
    {
        Duck::query()->update(['died_at' => null, 'last_fed_at' => now()]);

        return back()->with('success', '🦆 The pond has been restocked!');
    }

    /**
     * Persist death for ducks that have starved, so a reload is consistent even
     * if the browser never reported the deaths. Life is derived from the same
     * timestamps on both sides (see Duck::LIFESPAN_SECONDS and pondLife.ts).
     */
    private function reapStarvedDucks(): void
    {
        $cutoff = now()->subSeconds(Duck::LIFESPAN_SECONDS)->toDateTimeString();

        Duck::query()
            ->whereNull('died_at')
            ->whereRaw('COALESCE(last_fed_at, created_at) < ?', [$cutoff])
            ->update(['died_at' => now()]);
    }
}
