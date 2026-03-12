import { Head, Link, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
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
import type { BreadcrumbItem } from '@/types';

type CreateProps = {
    roles: string[];
    permissions: string[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Users', href: '/users' },
    { title: 'Create', href: '/users/create' },
];

export default function CreateUser({ roles, permissions }: CreateProps) {
    const { auth } = usePage().props;

    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [] as string[],
        permissions: [] as string[],
    });
    const formErrorBag = form.errors as Record<string, string | undefined>;

    const toggleArrayValue = (items: string[], value: string, checked: boolean) => {
        if (checked) {
            return [...items, value];
        }

        return items.filter((item) => item !== value);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post('/users');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create user" />

            <div className="space-y-6 px-4 py-6">
                <div className="flex items-center justify-between gap-4">
                    <Heading
                        title="Create user"
                        description="Assign roles first. Use direct permissions only when an exception is needed."
                    />

                    <Button asChild variant="outline">
                        <Link href="/users">Back</Link>
                    </Button>
                </div>

                {!auth.can.assignPermissions ? (
                    <Alert>
                        <AlertTitle>Role-first mode</AlertTitle>
                        <AlertDescription>
                            This panel follows Spatie best practice: users get access from roles.
                        </AlertDescription>
                    </Alert>
                ) : null}

                <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription>Basic account details.</CardDescription>
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
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={form.data.password}
                                    onChange={(event) => form.setData('password', event.target.value)}
                                />
                                <InputError message={form.errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirm password</Label>
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Roles</CardTitle>
                            <CardDescription>Roles define the main permission set.</CardDescription>
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
                                    Use only for exceptions. Default access should come from roles.
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
                            <AlertTitle>Unable to save user</AlertTitle>
                            <AlertDescription>{formErrorBag.users}</AlertDescription>
                        </Alert>
                    ) : null}

                    <div className="lg:col-span-3 flex gap-2">
                        <Button type="submit" disabled={form.processing}>
                            Create user
                        </Button>
                        <Button type="button" variant="outline" onClick={() => form.reset()}>
                            Reset form
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
