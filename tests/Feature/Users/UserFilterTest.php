<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    foreach (['user.view', 'user.create', 'user.update', 'user.delete', 'user.assign-role', 'user.assign-permission'] as $permissionName) {
        Permission::findOrCreate($permissionName, 'web');
    }

    $adminRole = Role::findOrCreate('admin', 'web');
    $adminRole->syncPermissions([
        'user.view',
        'user.create',
        'user.update',
        'user.assign-role',
        'user.assign-permission',
    ]);

    Role::findOrCreate('user', 'web');

    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('name and status filters return expected users', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    User::factory()->create([
        'name' => 'Ali Raza',
        'email' => 'ali@example.com',
        'email_verified_at' => now(),
    ])->assignRole('user');

    User::factory()->create([
        'name' => 'Sara Khan',
        'email' => 'sara@example.com',
        'email_verified_at' => null,
    ])->assignRole('user');

    $this->actingAs($admin)
        ->get('/users?filter[name]=Ali&filter[status]=verified')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('users/index')
            ->where('filters.name', 'Ali')
            ->where('filters.status', 'verified')
            ->has('users.data', 1)
            ->where('users.data.0.email', 'ali@example.com'),
        );
});

test('role and permission filters return expected users', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $userWithDeletePermission = User::factory()->create(['email' => 'deleter@example.com']);
    $userWithDeletePermission->assignRole('admin');
    $userWithDeletePermission->givePermissionTo('user.delete');

    $normalUser = User::factory()->create(['email' => 'normal@example.com']);
    $normalUser->assignRole('user');

    $this->actingAs($admin)
        ->get('/users?filter[roles.name]=admin&filter[permissions.name]=user.delete')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('users/index')
            ->where('filters.role', 'admin')
            ->where('filters.permission', 'user.delete')
            ->has('users.data', 1)
            ->where('users.data.0.email', 'deleter@example.com'),
        );
});

test('reset behavior returns unfiltered dataset', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    User::factory()->count(3)->create()->each->assignRole('user');

    $filteredResponse = $this->actingAs($admin)
        ->get('/users?filter[name]=non-existent-user-xyz');

    $filteredResponse
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('users/index')
            ->has('users.data', 0),
        );

    $resetResponse = $this->actingAs($admin)->get(route('users.index'));

    $resetResponse
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('users/index')
            ->has('users.data'),
        );
});

test('disallowed filter key is rejected', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get('/users?filter[random_field]=value')
        ->assertStatus(400);
});
