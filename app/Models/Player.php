<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Player extends Model
{
    /** @use HasFactory<\Database\Factories\PlayerFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
    ];

    public function team1()
    {
        return $this->hasMany(Team::class, 'player1_id');
    }

    public function team2()
    {
        return $this->hasMany(Team::class, 'player2_id');
    }
}
