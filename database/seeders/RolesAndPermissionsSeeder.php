<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        DB::transaction(function (): void {
            $this->seedPermissions();
            $this->seedRoles();
            $this->seedUsers();
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Seed default permissions.
     */
    private function seedPermissions(): void
    {
        $permissionNames = [
            'user.view',
            'user.create',
            'user.update',
            'user.delete',
            'user.assign-role',
            'user.assign-permission',
        ];

        $existingPermissions = Permission::query()
            ->where('guard_name', 'web')
            ->whereIn('name', $permissionNames)
            ->pluck('name')
            ->all();

        foreach ($permissionNames as $permissionName) {
            if (! in_array($permissionName, $existingPermissions, true)) {
                $permission = Permission::make([
                    'name' => $permissionName,
                    'guard_name' => 'web',
                ]);
                $permission->saveOrFail();
            }
        }
    }

    /**
     * Seed roles and assign permissions to them.
     */
    private function seedRoles(): void
    {
        $permissions = Permission::query()
            ->where('guard_name', 'web')
            ->get()
            ->keyBy('name');

        $superAdminRole = Role::query()->firstOrCreate(['name' => 'super admin', 'guard_name' => 'web']);
        $adminRole = Role::query()->firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $userRole = Role::query()->firstOrCreate(['name' => 'user', 'guard_name' => 'web']);

        foreach ($permissions as $permission) {
            $permission->assignRole($superAdminRole);
        }

        foreach ([
            'user.view',
            'user.create',
            'user.update',
            'user.assign-role',
            'user.assign-permission',
        ] as $permissionName) {
            if ($permissions->has($permissionName)) {
                $permissions[$permissionName]->assignRole($adminRole);
            }
        }

        foreach ($permissions as $permission) {
            $permission->removeRole($userRole);
        }
    }

    /**
     * Seed default users and assign roles.
     */
    private function seedUsers(): void
    {
        $superAdmin = User::query()->updateOrCreate(
            ['email' => 'superadmin@example.com'],
            ['name' => 'Super Admin', 'password' => 'Password123!'],
        );
        $superAdmin->syncRoles(['super admin']);
        $superAdmin->syncPermissions([]);

        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin User', 'password' => 'Password123!'],
        );
        $admin->syncRoles(['admin']);
        $admin->syncPermissions([]);

        $user = User::query()->updateOrCreate(
            ['email' => 'user@example.com'],
            ['name' => 'Regular User', 'password' => 'Password123!'],
        );
        $user->syncRoles(['user']);
        $user->syncPermissions([]);
    }
}
