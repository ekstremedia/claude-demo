<?php

declare(strict_types=1);

use App\Domains\Pond\Enums\DuckColor;

it('has a non-empty label and a valid hex for every colour', function (DuckColor $color) {
    expect($color->label())->toBeString()->not->toBeEmpty()
        ->and($color->hex())->toMatch('/^#[0-9a-f]{6}$/i');
})->with(DuckColor::cases());

it('exposes one option per case with value, label and hex', function () {
    $options = DuckColor::options();

    expect($options)->toHaveCount(count(DuckColor::cases()))
        ->and($options[0])->toHaveKeys(['value', 'label', 'hex']);
});
