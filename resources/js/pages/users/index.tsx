import { Head, Link, router, usePage } from '@inertiajs/react';
import { Filter, X } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmModal, useConfirmModal } from '@/components/confirm-modal';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { playAlertSound, playSuccessSound } from '@/lib/sounds';
import type { BreadcrumbItem } from '@/types';

type UserRow = {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    roles: Array<{ name: string }>;
    permissions: Array<{ name: string }>;
};

type PaginatorLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type UserPaginator = {
    data: UserRow[];
    links: PaginatorLink[];
    from: number | null;
    to: number | null;
    total: number;
};

type Filters = {
    name?: string | null;
    email?: string | null;
    role?: string | null;
    permission?: string | null;
    status?: string | null;
};

type IndexProps = {
    users: UserPaginator;
    filters: Filters;
    roles: string[];
    permissions: string[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Users', href: '/users' },
];

export default function UsersIndex({ users, filters, roles, permissions }: IndexProps) {
    const { auth, flash } = usePage().props;
    const deleteModal = useConfirmModal();
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

    // Play success sound when flash.success appears
    useEffect(() => {
        if (flash.success) {
            playSuccessSound();
        }
    }, [flash.success]);

    const [filtersOpen, setFiltersOpen] = useState(false);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const filterAreaRef = useRef<HTMLDivElement>(null);

    const [filterValues, setFilterValues] = useState({
        name: filters.name ?? '',
        email: filters.email ?? '',
        role: filters.role ?? '',
        permission: filters.permission ?? '',
        status: filters.status ?? '',
    });

    const [roleSearch, setRoleSearch] = useState('');
    const [permissionSearch, setPermissionSearch] = useState('');
    const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
    const [permissionDropdownOpen, setPermissionDropdownOpen] = useState(false);
    const roleRef = useRef<HTMLDivElement>(null);
    const permissionRef = useRef<HTMLDivElement>(null);

    const filteredRoles = useMemo(
        () => roles.filter((r) => r.toLowerCase().includes(roleSearch.toLowerCase())),
        [roles, roleSearch],
    );

    const filteredPermissions = useMemo(
        () => permissions.filter((p) => p.toLowerCase().includes(permissionSearch.toLowerCase())),
        [permissions, permissionSearch],
    );

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
                setRoleDropdownOpen(false);
            }
            if (permissionRef.current && !permissionRef.current.contains(event.target as Node)) {
                setPermissionDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const startHideTimer = useCallback(() => {
        hideTimerRef.current = setTimeout(() => {
            setFiltersOpen(false);
        }, 5000);
    }, []);

    const clearHideTimer = useCallback(() => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, []);

    const handleMouseEnter = () => clearHideTimer();
    const handleMouseLeave = () => startHideTimer();

    // Clean up timer on unmount
    useEffect(() => {
        return () => clearHideTimer();
    }, [clearHideTimer]);

    const summary = useMemo(() => {
        if (!users.total) {
            return 'No users found';
        }

        if (!users.from || !users.to) {
            return `${users.total} users`;
        }

        return `Showing ${users.from}-${users.to} of ${users.total}`;
    }, [users]);

    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            '/users',
            {
                filter: {
                    name: filterValues.name || undefined,
                    email: filterValues.email || undefined,
                    'roles.name': filterValues.role || undefined,
                    'permissions.name': filterValues.permission || undefined,
                    status: filterValues.status || undefined,
                },
            },
            { preserveState: true, replace: true },
        );
    };

    const resetFilters = () => {
        setFilterValues({
            name: '',
            email: '',
            role: '',
            permission: '',
            status: '',
        });
        setRoleSearch('');
        setPermissionSearch('');

        router.get('/users', {}, { preserveState: true, replace: true });
    };

    const deleteUser = async (userId: number, userName: string) => {
        setDeleteTarget({ id: userId, name: userName });
        playAlertSound();

        const confirmed = await deleteModal.confirm();
        if (confirmed) {
            router.delete(`/users/${userId}`, {
                preserveScroll: true,
            });
        }

        setDeleteTarget(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div className="space-y-6 px-4 py-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <Heading
                        title="User management"
                        description="Manage users with role-based access and permission checks"
                    />

                    {auth.can.createUsers ? (
                        <Button asChild>
                            <Link href="/users/create">Create user</Link>
                        </Button>
                    ) : null}
                </div>

                {flash.success ? (
                    <Alert className="border-green-500/30 bg-green-500/5">
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{flash.success}</AlertDescription>
                    </Alert>
                ) : null}

                {flash.error ? (
                    <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                ) : null}

                <div>
                    <Button
                        type="button"
                        variant={filtersOpen ? 'secondary' : 'outline'}
                        onClick={() => {
                            clearHideTimer();
                            setFiltersOpen((prev) => !prev);
                        }}
                        className="gap-2"
                    >
                        <Filter className="size-4" />
                        Filters
                        {(filterValues.name || filterValues.email || filterValues.role || filterValues.permission || filterValues.status) ? (
                            <Badge variant="secondary" className="ml-1 rounded-full px-1.5 text-xs">
                                active
                            </Badge>
                        ) : null}
                    </Button>
                </div>

                {filtersOpen ? (
                    <div
                        ref={filterAreaRef}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <div>
                                    <CardTitle className="text-base">Filters</CardTitle>
                                    <CardDescription>Narrow down the user list</CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    onClick={() => setFiltersOpen(false)}
                                >
                                    <X className="size-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={applyFilters} className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="filter-name">Name</Label>
                                        <Input
                                            id="filter-name"
                                            value={filterValues.name}
                                            onChange={(event) =>
                                                setFilterValues((current) => ({
                                                    ...current,
                                                    name: event.target.value,
                                                }))
                                            }
                                            placeholder="Search by name"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="filter-email">Email</Label>
                                        <Input
                                            id="filter-email"
                                            value={filterValues.email}
                                            onChange={(event) =>
                                                setFilterValues((current) => ({
                                                    ...current,
                                                    email: event.target.value,
                                                }))
                                            }
                                            placeholder="Search by email"
                                        />
                                    </div>

                                    <div className="relative grid gap-2" ref={roleRef}>
                                        <Label>Role</Label>
                                        <Input
                                            value={roleDropdownOpen ? roleSearch : (filterValues.role || '')}
                                            onFocus={() => {
                                                setRoleDropdownOpen(true);
                                                setRoleSearch('');
                                            }}
                                            onChange={(event) => setRoleSearch(event.target.value)}
                                            placeholder="Search roles…"
                                            autoComplete="off"
                                        />
                                        {roleDropdownOpen ? (
                                            <div className="bg-popover text-popover-foreground absolute top-full left-0 z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border shadow-md">
                                                <button
                                                    type="button"
                                                    className="text-muted-foreground hover:bg-accent w-full px-3 py-2 text-left text-sm"
                                                    onClick={() => {
                                                        setFilterValues((c) => ({ ...c, role: '' }));
                                                        setRoleDropdownOpen(false);
                                                        setRoleSearch('');
                                                    }}
                                                >
                                                    Any role
                                                </button>
                                                {filteredRoles.map((role) => (
                                                    <button
                                                        type="button"
                                                        key={role}
                                                        className={`hover:bg-accent w-full px-3 py-2 text-left text-sm ${filterValues.role === role ? 'bg-accent font-medium' : ''}`}
                                                        onClick={() => {
                                                            setFilterValues((c) => ({ ...c, role }));
                                                            setRoleDropdownOpen(false);
                                                            setRoleSearch('');
                                                        }}
                                                    >
                                                        {role}
                                                    </button>
                                                ))}
                                                {filteredRoles.length === 0 ? (
                                                    <div className="text-muted-foreground px-3 py-2 text-sm">No roles found</div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="relative grid gap-2" ref={permissionRef}>
                                        <Label>Permission</Label>
                                        <Input
                                            value={permissionDropdownOpen ? permissionSearch : (filterValues.permission || '')}
                                            onFocus={() => {
                                                setPermissionDropdownOpen(true);
                                                setPermissionSearch('');
                                            }}
                                            onChange={(event) => setPermissionSearch(event.target.value)}
                                            placeholder="Search permissions…"
                                            autoComplete="off"
                                        />
                                        {permissionDropdownOpen ? (
                                            <div className="bg-popover text-popover-foreground absolute top-full left-0 z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border shadow-md">
                                                <button
                                                    type="button"
                                                    className="text-muted-foreground hover:bg-accent w-full px-3 py-2 text-left text-sm"
                                                    onClick={() => {
                                                        setFilterValues((c) => ({ ...c, permission: '' }));
                                                        setPermissionDropdownOpen(false);
                                                        setPermissionSearch('');
                                                    }}
                                                >
                                                    Any permission
                                                </button>
                                                {filteredPermissions.map((permission) => (
                                                    <button
                                                        type="button"
                                                        key={permission}
                                                        className={`hover:bg-accent w-full px-3 py-2 text-left text-sm ${filterValues.permission === permission ? 'bg-accent font-medium' : ''}`}
                                                        onClick={() => {
                                                            setFilterValues((c) => ({ ...c, permission }));
                                                            setPermissionDropdownOpen(false);
                                                            setPermissionSearch('');
                                                        }}
                                                    >
                                                        {permission}
                                                    </button>
                                                ))}
                                                {filteredPermissions.length === 0 ? (
                                                    <div className="text-muted-foreground px-3 py-2 text-sm">No permissions found</div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="filter-status">Status</Label>
                                        <select
                                            id="filter-status"
                                            value={filterValues.status}
                                            onChange={(event) =>
                                                setFilterValues((current) => ({
                                                    ...current,
                                                    status: event.target.value,
                                                }))
                                            }
                                            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                        >
                                            <option value="">Any status</option>
                                            <option value="verified">Verified</option>
                                            <option value="unverified">Unverified</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-5">
                                        <Button type="submit">Apply filters</Button>
                                        <Button type="button" variant="outline" onClick={resetFilters}>
                                            Reset
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                ) : null}

                <Card>
                    <CardHeader>
                        <CardTitle>Users</CardTitle>
                        <CardDescription>{summary}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/40 text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Name</th>
                                        <th className="px-4 py-3 font-medium">Email</th>
                                        <th className="px-4 py-3 font-medium">Roles</th>
                                        <th className="px-4 py-3 font-medium">Direct permissions</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.length === 0 ? (
                                        <tr>
                                            <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                                                No users match the selected filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        users.data.map((user) => (
                                            <tr key={user.id} className="border-t">
                                                <td className="px-4 py-3 font-medium">{user.name}</td>
                                                <td className="px-4 py-3">{user.email}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles.map((role) => (
                                                            <Badge key={`${user.id}-${role.name}`} variant="secondary">
                                                                {role.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.permissions.length > 0 ? (
                                                            user.permissions.map((permission) => (
                                                                <Badge
                                                                    key={`${user.id}-${permission.name}`}
                                                                    variant="outline"
                                                                >
                                                                    {permission.name}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">
                                                                None
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {user.email_verified_at ? (
                                                        <Badge>Verified</Badge>
                                                    ) : (
                                                        <Badge variant="outline">Unverified</Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        {auth.can.updateUsers ? (
                                                            <Button asChild variant="outline" size="sm">
                                                                <Link href={`/users/${user.id}/edit`}>Edit</Link>
                                                            </Button>
                                                        ) : null}

                                                        {auth.can.deleteUsers && auth.user.id !== user.id ? (
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => deleteUser(user.id, user.name)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {users.links.map((link, index) => (
                                <Button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => {
                                        if (link.url) {
                                            router.visit(link.url, { preserveState: true });
                                        }
                                    }}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <ConfirmModal
                open={deleteModal.open}
                onConfirm={deleteModal.onConfirm}
                onCancel={deleteModal.onCancel}
                title="Delete user"
                description={
                    deleteTarget ? (
                        <>
                            Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
                        </>
                    ) : undefined
                }
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </AppLayout>
    );
}
