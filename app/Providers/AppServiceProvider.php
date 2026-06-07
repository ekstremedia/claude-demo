<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Our Inertia pages live in resources/js/Pages (capital P) to match the
        // page glob in app.ts. Inertia's default page resolver looks in a
        // lowercase resource_path('js/pages'), which only resolves on
        // case-insensitive filesystems (local Docker on macOS) and fails on
        // case-sensitive ones (Linux CI), breaking assertInertia()'s page-exists
        // check. Point the resolver at the real directory so it works everywhere.
        config(['inertia.pages.paths' => [resource_path('js/Pages')]]);
    }
}
