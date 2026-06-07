<?php

declare(strict_types=1);

arch('no debugging statements are left in the code')
    ->expect(['dd', 'dump', 'ray', 'var_dump', 'print_r'])
    ->not->toBeUsed();

arch('pond models extend Eloquent')
    ->expect('App\Domains\Pond\Models')
    ->toExtend('Illuminate\Database\Eloquent\Model');

arch('pond controllers extend the base controller')
    ->expect('App\Domains\Pond\Http\Controllers')
    ->toExtend('App\Http\Controllers\Controller');

arch('pond form requests extend FormRequest')
    ->expect('App\Domains\Pond\Http\Requests')
    ->toExtend('Illuminate\Foundation\Http\FormRequest');

arch('the whole pond domain declares strict types')
    ->expect('App\Domains\Pond')
    ->toUseStrictTypes();
