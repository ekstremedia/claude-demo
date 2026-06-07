<?php

declare(strict_types=1);

namespace App\Domains\Pond\Enums;

/**
 * The palette a rubber duck can come in.
 *
 * The backing value is what's stored in the `ducks.color` column and accepted
 * over the wire; `label()` and `hex()` are presentation helpers shared by the
 * JSON payload and the Vue swatch component, so colours are defined in exactly
 * one place.
 */
enum DuckColor: string
{
    case Yellow = 'yellow';
    case Blue = 'blue';
    case Pink = 'pink';
    case Green = 'green';
    case White = 'white'; // the classic "rubber" duck

    /** Human-friendly label for selects and cards. */
    public function label(): string
    {
        return match ($this) {
            self::Yellow => 'Classic Yellow',
            self::Blue => 'Ocean Blue',
            self::Pink => 'Bubblegum Pink',
            self::Green => 'Pond Green',
            self::White => 'Rubber White',
        };
    }

    /** Hex colour used for the swatch dot in the UI. */
    public function hex(): string
    {
        return match ($this) {
            self::Yellow => '#facc15',
            self::Blue => '#38bdf8',
            self::Pink => '#f472b6',
            self::Green => '#4ade80',
            self::White => '#f8fafc',
        };
    }

    /**
     * Serialise to a frontend-friendly option so the Vue `<select>` and the
     * ColorSwatch component share one source of truth.
     *
     * @return array{value: string, label: string, hex: string}
     */
    public function toArray(): array
    {
        return [
            'value' => $this->value,
            'label' => $this->label(),
            'hex' => $this->hex(),
        ];
    }

    /**
     * Every colour as a select option.
     *
     * @return list<array{value: string, label: string, hex: string}>
     */
    public static function options(): array
    {
        return array_map(static fn (self $color): array => $color->toArray(), self::cases());
    }
}
