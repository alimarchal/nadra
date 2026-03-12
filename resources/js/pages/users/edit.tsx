import { Head, Link, useForm, usePage } from '@inertiajs/react';
import type { FormEvent} from 'react';
import { useEffect } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { playSuccessSound } from '@/lib/sounds';
import type { BreadcrumbItem } from '@/types';

type EditableUser = {
    id: number;
    name: string;
    email: string;
    client_branch_id: string | null;
    client_machine_identifier: string | null;
    roles: string[];
    permissions: string[];
};

type EditProps = {
    user: EditableUser;
    roles: string[];
    permissions: string[];
};

export default function EditUser({ user, roles, permissions }: EditProps) {
    const { auth, flash } = usePage().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Users', href: '/users' },
        { title: `Edit ${user.name}`, href: `/users/${user.id}/edit` },
    ];

    const form = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        roles: user.roles,
        permissions: user.permissions,
        client_branch_id: user.client_branch_id ?? '',
        client_machine_identifier: user.client_machine_identifier ?? '',
    });
    const formErrorBag = form.errors as Record<string, string | undefined>;

    // Play success sound when flash.success appears
    useEffect(() => {
        if (flash.success) {
            playSuccessSound();
        }
    }, [flash.success]);

    const toggleArrayValue = (items: string[], value: string, checked: boolean) => {
        if (checked) {
            return [...items, value];
        }

        return items.filter((item) => item !== value);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.put(`/users/${user.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${user.name}`} />

            <div className="space-y-6 px-4 py-6">
                <div className="flex items-center justify-between gap-4">
                    <Heading
                        title={`Edit ${user.name}`}
                        description="Keep roles as primary access control. Use direct permissions only for exceptions."
                    />

                    <Button asChild variant="outline">
                        <Link href="/users">Back</Link>
                    </Button>
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

                <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription>Update user details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(event) => form.setData('name', event.target.value)}
                                />
                                <InputError message={form.errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(event) => form.setData('email', event.target.value)}
                                />
                                <InputError message={form.errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">New password (optional)</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={form.data.password}
                                    onChange={(event) => form.setData('password', event.target.value)}
                                />
                                <InputError message={form.errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirm new password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={form.data.password_confirmation}
                                    onChange={(event) =>
                                        form.setData('password_confirmation', event.target.value)
                                    }
                                />
                                <InputError message={form.errors.password_confirmation} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="client_branch_id">Branch ID</Label>
                                    <Input
                                        id="client_branch_id"
                                        value={form.data.client_branch_id}
                                        onChange={(event) => form.setData('client_branch_id', event.target.value)}
                                        placeholder="e.g. 123456"
                                    />
                                    <InputError message={form.errors.client_branch_id} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="client_machine_identifier">Machine Identifier</Label>
                                    <Input
                                        id="client_machine_identifier"
                                        value={form.data.client_machine_identifier}
                                        onChange={(event) => form.setData('client_machine_identifier', event.target.value)}
                                        placeholder="e.g. ac-de-hf-qw-03"
                                    />
                                    <InputError message={form.errors.client_machine_identifier} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Roles</CardTitle>
                            <CardDescription>Primary permission grouping.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {roles.map((role) => (
                                <label key={role} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={form.data.roles.includes(role)}
                                        onCheckedChange={(checked) =>
                                            form.setData(
                                                'roles',
                                                toggleArrayValue(
                                                    form.data.roles,
                                                    role,
                                                    Boolean(checked),
                                                ),
                                            )
                                        }
                                    />
                                    <span className="capitalize">{role}</span>
                                </label>
                            ))}
                            <InputError message={form.errors.roles} />
                        </CardContent>
                    </Card>

                    {auth.can.assignPermissions ? (
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Direct permissions (optional)</CardTitle>
                                <CardDescription>
                                    Rare exceptions only. Permission changes apply immediately.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {permissions.map((permission) => (
                                    <label key={permission} className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={form.data.permissions.includes(permission)}
                                            onCheckedChange={(checked) =>
                                                form.setData(
                                                    'permissions',
                                                    toggleArrayValue(
                                                        form.data.permissions,
                                                        permission,
                                                        Boolean(checked),
                                                    ),
                                                )
                                            }
                                        />
                                        <span>{permission}</span>
                                        {permission === 'user.delete' ? (
                                            <Badge variant="outline">critical</Badge>
                                        ) : null}
                                    </label>
                                ))}
                                <InputError message={form.errors.permissions} className="md:col-span-2 lg:col-span-3" />
                            </CardContent>
                        </Card>
                    ) : null}

                    {formErrorBag.users ? (
                        <Alert variant="destructive" className="lg:col-span-3 border-destructive/30 bg-destructive/10">
                            <AlertTitle>Unable to update user</AlertTitle>
                            <AlertDescription>{formErrorBag.users}</AlertDescription>
                        </Alert>
                    ) : null}

                    <div className="lg:col-span-3 flex gap-2">
                        <Button type="submit" disabled={form.processing}>
                            Save changes
                        </Button>
                        <Button type="button" variant="outline" onClick={() => form.reset('password', 'password_confirmation')}>
                            Clear passwords
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
