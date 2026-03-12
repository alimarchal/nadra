<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NadraFingerIndex extends Model
{
    protected $table = 'nadra_finger_indexes';

    protected $fillable = [
        'name',
        'label',
    ];
}
