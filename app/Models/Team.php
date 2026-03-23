<?php

namespace App\Models;

use Database\Factories\TeamFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Team extends Model
{
    /** @use HasFactory<TeamFactory> */
    use HasFactory, HasUuids;

    public function players(): BelongsToMany
    {
        return $this->BelongsToMany(User::class, 'team_user');
    }
}
