import AuthCardLayout, { type AuthLayoutProps } from '@/layouts/auth/auth-card-layout';

export default function AuthLayout({
    title,
    description,
    children,
}: AuthLayoutProps) {
    return (
        <AuthCardLayout title={title} description={description}>
            {children}
        </AuthCardLayout>
    );
}
