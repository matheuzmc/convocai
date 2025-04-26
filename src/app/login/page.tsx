'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; // Use the client component helper
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout"; // Assuming MobileLayout exists

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient(); // Initialize Supabase client

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        throw signInError;
      }

      toast.success("Login realizado com sucesso!");
      // The middleware should handle redirection for logged-in users
      // navigating away or refreshing. We might need a manual push here
      // if the middleware doesn't catch the immediate state change within the same navigation.
      router.push('/dashboard'); // Manual push to dashboard after successful sign-in
      // Refresh might be needed if middleware doesn't update session immediately
      // router.refresh();

    } catch (err) {
      console.error("[Login Page] Login error:", err);
      let errorMessage = "Ocorreu um erro durante o login.";
      // Type guard for Supabase AuthError or generic Error
      if (typeof err === 'object' && err !== null && 'message' in err) {
         errorMessage = (err as Error).message;
      } 
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Note: The middleware should redirect logged-in users away from this page.
  // So, we don't necessarily need the complex loading/user checks from the old AuthContext approach here.

  return (
    <MobileLayout>
      <div className="w-full max-w-sm space-y-8 px-4 py-20 mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Entrar</h1>
          <p className="text-muted-foreground">
            Acesse sua conta para gerenciar seus grupos esportivos
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {error && (
              <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive mb-4">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {/* <Link
                    href="/forgot-password" // Adjust if you have a forgot password page
                    className="text-sm text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </Link> */}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                 {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                 ) : null}
                 {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link
                href="/register"
                className="text-primary hover:underline"
              >
                Cadastre-se
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </MobileLayout>
  );
} 