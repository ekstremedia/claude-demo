// Shared TypeScript shapes for the Rubber Duck Pond. These mirror exactly what
// the controllers send (see DuckResource / DuckController::stats), so the Vue
// side is fully typed end to end.

export interface EnumOption {
    value: string;
    label: string;
}

export interface ColorOption extends EnumOption {
    hex: string;
}

export interface MoodOption extends EnumOption {
    emoji: string;
}

export interface DuckPond {
    id: number;
    name: string;
}

export interface Duck {
    id: number;
    name: string;
    pond: DuckPond | null;
    color: ColorOption;
    mood: MoodOption;
    adopted_at: string;
    bio: string | null;
    // Survival timestamps (ISO 8601). The canvas derives each duck's life from
    // these — see pondLife.ts (mirror of Duck::LIFESPAN_SECONDS on the server).
    created_at: string;
    last_fed_at: string | null;
    died_at: string | null;
}

export interface DuckStats {
    total_ducks: number;
    total_ponds: number;
    by_mood: Record<string, number>;
}

export interface DuckFilters {
    search: string | null;
    mood: string | null;
    color: string | null;
}

export interface DuckOptions {
    colors: ColorOption[];
    moods: MoodOption[];
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

/** A Laravel length-aware paginator, as serialised to Inertia props. */
export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}
