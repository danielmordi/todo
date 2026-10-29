import { Head, useForm } from '@inertiajs/react';
import type React from 'react';
import AuthLayout from '@/layouts/auth-layout';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store } from '@/routes/login';

interface LoginProps {
    status?: string;
    canResetPassword?: boolean;
}

export default function Login({ status, canResetPassword = false }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(store.url(), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout 
            title="Welcome back"
            description="Sign in to access your clients, projects, and tasks"
        >
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        autoComplete="username"
                        autoFocus
                        placeholder="name@example.com"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    <InputError message={errors.email} />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        {canResetPassword && (
                            <a
                                href="/forgot-password"
                                className="text-xs text-muted-foreground hover:text-primary"
                            >
                                Forgot password?
                            </a>
                        )}
                    </div>
                    <PasswordInput
                        id="password"
                        name="password"
                        value={data.password}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="remember"
                        checked={data.remember}
                        onCheckedChange={(checked) => setData('remember', checked === true)}
                    />
                    <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                        Remember me for 30 days
                    </Label>
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? 'Signing in...' : 'Sign in'}
                </Button>
            </form>
        </AuthLayout>
    );
}
