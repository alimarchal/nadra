<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
            'client_branch_id' => fake()->numerify('######'),
            'client_machine_identifier' => fake()->macAddress(),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the model has two-factor authentication configured.
     */
    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }

    /**
     * Assign the super admin role after creating the user.
     */
    public function superAdmin(): static
    {
        return $this->afterCreating(function (User $user): void {
            $user->assignRole('super admin');
        });
    }

    /**
     * Assign the admin role after creating the user.
     */
    public function admin(): static
    {
        return $this->afterCreating(function (User $user): void {
            $user->assignRole('admin');
        });
    }

    /**
     * Assign the user role after creating the user.
     */
    public function standardUser(): static
    {
        return $this->afterCreating(function (User $user): void {
            $user->assignRole('user');
        });
    }
}
