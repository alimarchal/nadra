<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NadraResponseCode extends Model
{
    protected $fillable = [
        'code',
        'message',
    ];
}
