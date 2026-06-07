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
| The duck grid lives at /pond; ducks themselves are a resource (no `show`).
| The animated pond lives at /ponds.
|
*/
Route::get('/pond', [DuckController::class, 'index'])->name('pond.index');
Route::resource('ducks', DuckController::class)->only(['store', 'update', 'destroy']);
Route::resource('ponds', PondController::class)->only(['index', 'store', 'update', 'destroy']);
