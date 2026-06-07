<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test bootstrap
|--------------------------------------------------------------------------
|
| Bind the application TestCase and a fresh database to every Feature and Unit
| test. RefreshDatabase migrates an in-memory SQLite database (see phpunit.xml)
| and rolls each test back in a transaction, so no test ever leaks state into
| the next one.
|
| Feature tests also stub the Vite directive (withoutVite) so rendering a page
| never needs a built `public/build/manifest.json` — CI runs the PHP suite
| without compiling front-end assets.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->beforeEach(fn () => $this->withoutVite())
    ->in('Feature');

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Unit');
