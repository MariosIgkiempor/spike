<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SeasonResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'customName' => $this->custom_name,
            'displayName' => $this->displayName(),
            'isActive' => $this->is_active,
            'startedAt' => $this->started_at,
            'endedAt' => $this->ended_at,
        ];
    }
}
