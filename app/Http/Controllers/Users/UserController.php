<?php

namespace App\Http\Controllers\Users;

use App\Http\Controllers\Controller;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Throwable;

class UserController extends Controller implements HasMiddleware
{
    /**
     * Get the middleware that should be assigned to the controller.
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:user.view', only: ['index']),
            new Middleware('permission:user.create', only: ['create', 'store']),
            new Middleware('permission:user.update', only: ['edit', 'update']),
            new Middleware('permission:user.delete', only: ['destroy']),
            new Middleware('permission:user.assign-role', only: ['create', 'store', 'edit', 'update']),
            new Middleware('permission:user.assign-permission', only: ['create', 'store', 'edit', 'update']),
        ];
    }

    /**
     * Display a listing of users.
     */
    public function index(): Response
    {
        $this->authorize('viewAny', User::class);

        $users = QueryBuilder::for(User::query()->with(['roles:id,name', 'permissions:id,name']))
            ->allowedFilters([
                AllowedFilter::partial('name'),
                AllowedFilter::partial('email'),
                AllowedFilter::exact('roles.name', 'roles.name'),
                AllowedFilter::exact('permissions.name', 'permissions.name'),
                AllowedFilter::callback('status', function (Builder $query, mixed $value): void {
                    if ($value === 'verified') {
                        $query->whereNotNull('email_verified_at');
                    }

                    if ($value === 'unverified') {
                        $query->whereNull('email_verified_at');
                    }
                }),
            ])
            ->allowedSorts(['id', 'name', 'email', 'created_at'])
            ->defaultSort('-created_at')
            ->paginate(10)
            ->withQueryString();

        $activeFilters = (array) request()->input('filter', []);

        return Inertia::render('users/index', [
            'users' => $users,
            'filters' => [
                'name' => $activeFilters['name'] ?? null,
                'email' => $activeFilters['email'] ?? null,
                'role' => $activeFilters['roles.name'] ?? null,
                'permission' => $activeFilters['permissions.name'] ?? null,
                'status' => $activeFilters['status'] ?? null,
            ],
            'sort' => request()->input('sort'),
            'roles' => Role::query()->orderBy('name')->pluck('name'),
            'permissions' => Permission::query()->orderBy('name')->pluck('name'),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('users/create', [
            'roles' => Role::query()->orderBy('name')->pluck('name'),
            'permissions' => Permission::query()->orderBy('name')->pluck('name'),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->authorize('create', User::class);

        $validated = $request->validated();

        try {
            DB::transaction(function () use ($validated): void {
                $user = User::query()->create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => $validated['password'],
                    'client_branch_id' => $validated['client_branch_id'] ?? null,
                    'client_machine_identifier' => $validated['client_machine_identifier'] ?? null,
                ]);

                $user->syncRoles($validated['roles']);
                $user->syncPermissions($validated['permissions'] ?? []);
            });

            app(PermissionRegistrar::class)->forgetCachedPermissions();

            return to_route('users.index')->with('success', 'User created successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()
                ->withInput()
                ->withErrors(['users' => 'Unable to create user right now. Please try again.']);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user): Response
    {
        $this->authorize('update', $user);

        return Inertia::render('users/edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'client_branch_id' => $user->client_branch_id,
                'client_machine_identifier' => $user->client_machine_identifier,
                'roles' => $user->getRoleNames()->values()->all(),
                'permissions' => $user->getDirectPermissions()->pluck('name')->values()->all(),
            ],
            'roles' => Role::query()->orderBy('name')->pluck('name'),
            'permissions' => Permission::query()->orderBy('name')->pluck('name'),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $validated = $request->validated();

        try {
            DB::transaction(function () use ($user, $validated): void {
                $user->fill([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'client_branch_id' => $validated['client_branch_id'] ?? null,
                    'client_machine_identifier' => $validated['client_machine_identifier'] ?? null,
                ]);

                if (! empty($validated['password'])) {
                    $user->password = $validated['password'];
                }

                $user->save();
                $user->syncRoles($validated['roles']);
                $user->syncPermissions($validated['permissions'] ?? []);
            });

            app(PermissionRegistrar::class)->forgetCachedPermissions();

            return to_route('users.index')->with('success', 'User updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()
                ->withInput()
                ->withErrors(['users' => 'Unable to update user right now. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('delete', $user);

        try {
            DB::transaction(function () use ($user): void {
                $user->delete();
            });

            return to_route('users.index')->with('success', 'User deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return to_route('users.index')->with('error', 'Unable to delete user right now.');
        }
    }
}
