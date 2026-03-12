<?php

namespace App\Models;

use Database\Factories\NadraVerificationFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NadraVerification extends Model
{
    /** @use HasFactory<NadraVerificationFactory> */
    use HasFactory;

    use HasUuids;

    protected $fillable = [
        'user_id',
        'session_id',
        'citizen_number',
        'citizen_contact_number',
        'finger_index',
        'template_type',
        'finger_template',
        'photograph',
        'transaction_id',
        'area_name',
        'client_branch_id',
        'client_machine_identifier',
        'client_session_id',
        'client_timestamp',
        'latitude',
        'longitude',
        'response_code',
        'response_message',
        'facial_result',
        'fingerprint_result',
        'citizen_data',
        'available_fingers',
        'raw_request',
        'raw_response',
        'is_successful',
    ];

    protected function casts(): array
    {
        return [
            'citizen_data' => 'array',
            'available_fingers' => 'array',
            'raw_request' => 'array',
            'raw_response' => 'array',
            'is_successful' => 'boolean',
            'latitude' => 'decimal:6',
            'longitude' => 'decimal:6',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
