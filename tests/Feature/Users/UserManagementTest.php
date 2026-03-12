<?php

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    $permissionNames = [
        'user.view',
        'user.create',
        'user.update',
        'user.delete',
        'user.assign-role',
        'user.assign-permission',
    ];

    foreach ($permissionNames as $permissionName) {
        Permission::findOrCreate($permissionName, 'web');
    }

    $superAdminRole = Role::findOrCreate('super admin', 'web');
    $adminRole = Role::findOrCreate('admin', 'web');
    Role::findOrCreate('user', 'web');

    $superAdminRole->syncPermissions($permissionNames);
    $adminRole->syncPermissions([
        'user.view',
        'user.create',
        'user.update',
        'user.assign-role',
        'user.assign-permission',
    ]);

    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('guests cannot access user management routes', function () {
    $this->get(route('users.index'))->assertRedirect(route('login'));
});

test('users without permissions cannot access user listing', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('users.index'))
        ->assertForbidden();
});

test('admins can view user listing with filters panel visible', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get(route('users.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('users/index')
            ->has('users.data')
            ->has('filters')
            ->where('filters.name', null)
            ->where('filters.email', null)
            ->where('filters.role', null)
            ->where('filters.permission', null)
            ->where('filters.status', null),
        );
});

test('a user with direct user delete permission can delete another user', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $admin->givePermissionTo('user.delete');

    $target = User::factory()->create();

    $this->actingAs($admin)
        ->delete(route('users.destroy', $target))
        ->assertRedirect(route('users.index'));

    $this->assertDatabaseMissing('users', ['id' => $target->id]);
});

test('removing direct user delete permission blocks deletion', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $admin->givePermissionTo('user.delete');
    $admin->revokePermissionTo('user.delete');

    $target = User::factory()->create();

    $this->actingAs($admin)
        ->delete(route('users.destroy', $target))
        ->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $target->id]);
});

test('super admin cannot delete self even with role permissions', function () {
    $superAdmin = User::factory()->create();
    $superAdmin->assignRole('super admin');

    $this->actingAs($superAdmin)
        ->delete(route('users.destroy', $superAdmin))
        ->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $superAdmin->id]);
});

test('database seeder creates expected default users roles and permissions', function () {
    $this->seed(DatabaseSeeder::class);

    $superAdmin = User::query()->where('email', 'superadmin@example.com')->firstOrFail();
    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
    $user = User::query()->where('email', 'user@example.com')->firstOrFail();

    expect($superAdmin->hasRole('super admin'))->toBeTrue();
    expect($admin->hasRole('admin'))->toBeTrue();
    expect($user->hasRole('user'))->toBeTrue();
    expect(Permission::query()->where('name', 'user.delete')->exists())->toBeTrue();
});
