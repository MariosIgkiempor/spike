<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leagues', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->foreignUuid('user_id')->constrained('users');
            $table->timestamps();
        });

        Schema::create('league_user', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained('users');
            $table->foreignUuid('league_id')->constrained('leagues');
        });
    }
};
