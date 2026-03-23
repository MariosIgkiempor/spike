<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seasons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('league_id')->constrained('leagues')->cascadeOnDelete();
            $table->unsignedInteger('number');
            $table->string('custom_name')->nullable();
            $table->boolean('is_active')->default(false);
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->unique(['league_id', 'number']);
            $table->index(['league_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seasons');
    }
};
