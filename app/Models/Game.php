<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Game extends Model
{
    /** @use HasFactory<\Database\Factories\GameFactory> */
    use HasFactory;

    protected $fillable = [
        'team1_player1_id',
        'team1_player2_id',
        'team2_player1_id',
        'team2_player2_id',
        'team1_score',
        'team2_score',
        'is_completed',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
    ];

    public function team1_player1()
    {
        return $this->belongsTo(User::class, 'team1_player1_id');
    }

    public function team1_player2()
    {
        return $this->belongsTo(User::class, 'team1_player2_id');
    }

    public function team2_player1()
    {
        return $this->belongsTo(User::class, 'team2_player1_id');
    }

    public function team2_player2()
    {
        return $this->belongsTo(User::class, 'team2_player2_id');
    }
}
