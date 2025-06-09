<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::dropIfExists('players');

        Schema::dropIfExists('games');

        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team1_player1_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('team1_player2_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('team2_player1_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('team2_player2_id')->constrained('users')->onDelete('cascade');
            $table->integer('team1_score');
            $table->integer('team2_score');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('games');

        Schema::create('players', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team1_player1_id')->constrained('players')->onDelete('cascade');
            $table->foreignId('team1_player2_id')->constrained('players')->onDelete('cascade');
            $table->foreignId('team2_player1_id')->constrained('players')->onDelete('cascade');
            $table->foreignId('team2_player2_id')->constrained('players')->onDelete('cascade');
            $table->integer('team1_score');
            $table->integer('team2_score');
            $table->timestamps();
        });
    }
}; 