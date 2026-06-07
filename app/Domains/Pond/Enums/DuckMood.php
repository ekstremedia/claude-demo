<?php

declare(strict_types=1);

namespace App\Domains\Pond\Enums;

/**
 * How a rubber duck is feeling today.
 *
 * Like {@see DuckColor}, the backing value is persisted and validated, while
 * `label()` and `emoji()` drive the presentation — keeping the mood palette in
 * a single, type-safe place shared by the backend and the Vue components.
 */
enum DuckMood: string
{
    case Happy = 'happy';
    case Sleepy = 'sleepy';
    case Excited = 'excited';
    case Zen = 'zen';
    case Grumpy = 'grumpy';

    /** Human-friendly label for selects and cards. */
    public function label(): string
    {
        return match ($this) {
            self::Happy => 'Happy',
            self::Sleepy => 'Sleepy',
            self::Excited => 'Excited',
            self::Zen => 'Zen',
            self::Grumpy => 'Grumpy',
        };
    }

    /** The emoji shown on the mood pill. */
    public function emoji(): string
    {
        return match ($this) {
            self::Happy => '😄',
            self::Sleepy => '😴',
            self::Excited => '🤩',
            self::Zen => '🧘',
            self::Grumpy => '😠',
        };
    }

    /**
     * Serialise to a frontend-friendly option so the Vue `<select>` and the
     * MoodPill component share one source of truth.
     *
     * @return array{value: string, label: string, emoji: string}
     */
    public function toArray(): array
    {
        return [
            'value' => $this->value,
            'label' => $this->label(),
            'emoji' => $this->emoji(),
        ];
    }

    /**
     * Every mood as a select option.
     *
     * @return list<array{value: string, label: string, emoji: string}>
     */
    public static function options(): array
    {
        return array_map(static fn (self $mood): array => $mood->toArray(), self::cases());
    }
}
