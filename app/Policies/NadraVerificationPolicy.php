<?php

namespace App\Policies;

use App\Models\NadraVerification;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class NadraVerificationPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->can('nadra-verification.view');
    }

    public function view(User $user, NadraVerification $verification): bool
    {
        if (! $user->can('nadra-verification.view')) {
            return false;
        }

        return $user->can('nadra-verification.view-all') || $verification->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->can('nadra-verification.create');
    }

    public function update(User $user, NadraVerification $verification): bool
    {
        if (! $user->can('nadra-verification.update')) {
            return false;
        }

        return $user->can('nadra-verification.view-all') || $verification->user_id === $user->id;
    }

    public function delete(User $user, NadraVerification $verification): bool
    {
        if (! $user->can('nadra-verification.delete')) {
            return false;
        }

        return $user->can('nadra-verification.view-all') || $verification->user_id === $user->id;
    }

    public function callApi(User $user): bool
    {
        return $user->can('nadra-verification.call-api');
    }
}
