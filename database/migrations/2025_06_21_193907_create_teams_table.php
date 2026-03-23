<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teams', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->timestamps();
        });

        Schema::create('game_team', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('game_id')->constrained('games');
            $table->foreignUuid('team_id')->constrained('teams');
            $table->integer('score');
            $table->boolean('won');
            $table->timestamps();
        });

        Schema::create('team_user', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->constrained('users');
            $table->foreignUuid('team_id')->constrained('teams');
            $table->timestamps();
        });
    }
};
