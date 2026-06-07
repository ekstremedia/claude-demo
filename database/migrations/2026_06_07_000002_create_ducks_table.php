<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ducks', function (Blueprint $table): void {
            $table->id();
            // nullOnDelete: deleting a pond leaves its ducks "homeless", not deleted.
            $table->foreignId('pond_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('color');  // backed by the DuckColor enum
            $table->string('mood');   // backed by the DuckMood enum
            $table->date('adopted_at');
            $table->text('bio')->nullable();
            // Survival: when the duck last ate, and when it starved (if it did).
            $table->timestamp('last_fed_at')->nullable();
            $table->timestamp('died_at')->nullable()->index();
            $table->timestamps();

            // Indexes backing the index-page search and filters.
            $table->index('mood');
            $table->index('color');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ducks');
    }
};
