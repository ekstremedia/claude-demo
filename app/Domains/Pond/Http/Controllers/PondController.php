<?php

declare(strict_types=1);

namespace App\Domains\Pond\Http\Controllers;

use App\Domains\Pond\Enums\DuckColor;
use App\Domains\Pond\Enums\DuckMood;
use App\Domains\Pond\Http\Requests\StorePondRequest;
use App\Domains\Pond\Http\Requests\UpdatePondRequest;
use App\Domains\Pond\Http\Resources\DuckResource;
use App\Domains\Pond\Models\Duck;
use App\Domains\Pond\Models\Pond;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Manage the ponds that ducks call home, and render the animated pond canvas
 * where every duck floats around with mood-driven motion.
 */
class PondController extends Controller
{
    /**
     * The pond page: every duck (for the canvas) plus the pond list and the
     * option lists the duck edit form needs when a duck is clicked.
     */
    public function index(): Response
    {
        return Inertia::render('Pond/Ponds', [
            'ducks' => Duck::query()
                ->with('pond:id,name')
                ->orderBy('name')
                ->get()
                ->map(fn (Duck $duck) => (new DuckResource($duck))->resolve()),
            'ponds' => Pond::query()
                ->withCount('ducks')
                ->orderBy('name')
                ->get()
                ->map(fn (Pond $pond): array => [
                    'id' => $pond->id,
                    'name' => $pond->name,
                    'description' => $pond->description,
                    'ducks_count' => (int) $pond->ducks_count,
                ]),
            'options' => [
                'colors' => DuckColor::options(),
                'moods' => DuckMood::options(),
            ],
        ]);
    }

    /** Dig a new pond. */
    public function store(StorePondRequest $request): RedirectResponse
    {
        $pond = Pond::create($request->validated());

        return back()->with('success', "🌊 {$pond->name} was dug.");
    }

    /** Rename a pond or update its description. */
    public function update(UpdatePondRequest $request, Pond $pond): RedirectResponse
    {
        $pond->update($request->validated());

        return back()->with('success', "✏️ {$pond->name} was updated.");
    }

    /** Drain a pond. Its ducks survive as "homeless" thanks to the nullOnDelete FK. */
    public function destroy(Pond $pond): RedirectResponse
    {
        $name = $pond->name;
        $pond->delete();

        return back()->with('success', "🪹 {$name} was drained — its ducks are now homeless.");
    }
}
