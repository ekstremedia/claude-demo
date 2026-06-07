<?php

use App\Domains\Pond\Http\Controllers\DuckController;
use App\Domains\Pond\Http\Controllers\PondController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Welcome', [
    'laravelVersion' => Application::VERSION,
    'phpVersion' => PHP_VERSION,
]))->name('home');

Route::get('/dashboard', fn () => Inertia::render('Dashboard'))->name('dashboard');

/*
|--------------------------------------------------------------------------
| Rubber Duck Pond 🦆
|--------------------------------------------------------------------------
|
| The duck grid lives at /pond; the living pond (feed-or-they-die) is at /ponds.
| The feed/die survival actions are declared before the `ducks` resource so the
| literal paths aren't shadowed by the resource's wildcards.
|
*/
Route::get('/pond', [DuckController::class, 'index'])->name('pond.index');
Route::post('/ducks/feed', [DuckController::class, 'feed'])->name('ducks.feed');
Route::post('/ducks/die', [DuckController::class, 'bury'])->name('ducks.die');
Route::resource('ducks', DuckController::class)->only(['store', 'update', 'destroy']);

Route::get('/ponds', [PondController::class, 'index'])->name('ponds.index');
Route::post('/pond/restock', [PondController::class, 'restock'])->name('pond.restock');
