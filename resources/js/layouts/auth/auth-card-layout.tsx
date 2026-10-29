import type React from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface AuthLayoutProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
}

export default function AuthCardLayout({
    title,
    description,
    children,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="mb-6 flex flex-col items-center gap-2">
                    <div className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <AppLogoIcon className="size-7 fill-current" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">Task Tracker</span>
                </div>

                <Card>
                    {(title || description) && (
                        <CardHeader className="space-y-1 text-center">
                            {title && <CardTitle className="text-xl font-semibold">{title}</CardTitle>}
                            {description && <CardDescription>{description}</CardDescription>}
                        </CardHeader>
                    )}
                    <CardContent>{children}</CardContent>
                </Card>
            </div>
        </div>
    );
}
