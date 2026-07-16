import { AuthForm } from '@/components/AuthForm';

export const metadata = {
  title: 'Login - CapstoneAI',
  description: 'Sign in to access the CapstoneAI terminal',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-6">
      <AuthForm initialMode="login" />
    </div>
  );
}