<?php

declare(strict_types=1);

use App\Domains\Pond\Enums\DuckMood;

it('has a non-empty label and emoji for every mood', function (DuckMood $mood) {
    expect($mood->label())->toBeString()->not->toBeEmpty()
        ->and($mood->emoji())->toBeString()->not->toBeEmpty();
})->with(DuckMood::cases());

it('exposes one option per case with value, label and emoji', function () {
    $options = DuckMood::options();

    expect($options)->toHaveCount(count(DuckMood::cases()))
        ->and($options[0])->toHaveKeys(['value', 'label', 'emoji']);
});
