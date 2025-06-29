<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function leagues(): BelongsToMany
    {
        return $this->belongsToMany(League::class);
    }

    public function gamesByMonth()
    {
        // 1) grab and group your games by “m-Y”
        $games = $this->games();
        $grouped = $games->groupBy(fn($game) => $game->created_at->format('m-Y'));

        // 2) build an ordered list of the last 6 months
        $end = Carbon::now();
        $start = (clone $end)->subMonths(5);
        $months = [];
        for ($date = $start->copy(); $date->lte($end); $date->addMonthNoOverflow()) {
            $months[] = $date->format('m-Y');
        }

        // 3) map each month to your played/won totals (0 when no games)
        return collect($months)
            ->map(fn(string $month) => [
                'month' => $month,
                'played' => $grouped->has($month)
                    ? $grouped[$month]->count()
                    : 0,
                'won' => $grouped->has($month)
                    // replace this filter logic with however you detect wins
                    ? $grouped[$month]
                        ->filter(fn($game) => $game->teams
                            ->where('pivot.won', true)
                            ->flatMap->players
                            ->contains('id', $this->id)
                        )
                        ->count()
                    : 0,
            ])
            ->values()
            ->all();
    }

    public function games()
    {
        return Game::whereHas('teams', function ($q) {
            $q->whereHas('players', function ($q) {
                $q->where('users.id', $this->id);
            });
        })->get();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
