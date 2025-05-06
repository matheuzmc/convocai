'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { createClient } from '@/lib/supabase/client';
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

// Define a loading component for Suspense fallback
function RegisterFormSkeleton() {
  return (
    <div className="w-full max-w-sm space-y-8 px-4 py-20 mx-auto">
      <div className="text-center space-y-2">
        <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto animate-pulse"></div>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Simulate form fields loading */}
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-10 bg-gray-300 rounded w-full animate-pulse mt-4"></div>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </CardFooter>
      </Card>
    </div>
  );
}

// Original component logic moved into a new component
function RegisterContent() {
  const supabase = createClient();
  const searchParams = useSearchParams(); // This hook requires Suspense

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);

  useEffect(() => {
    const next = searchParams.get('next');
    if (next) {
      if (next.startsWith('/')) {
        setNextPath(next);
        console.log("[Register Page] Found 'next' parameter:", next);
      } else {
        console.warn("[Register Page] Invalid 'next' parameter received:", next);
      }
    }
  }, [searchParams]);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
     event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      const msg = "As senhas não coincidem.";
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    const emailRedirectURL = nextPath
      ? `${window.location.origin}${nextPath}`
      : undefined;

    console.log("[Register Page] Email redirect URL:", emailRedirectURL);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: name,
            last_name: lastName,
          },
          emailRedirectTo: emailRedirectURL,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // Check if email confirmation is required (user has an identity but is not confirmed)
      // or if auto-confirmation is on (user object exists but no identities array or empty identities array)
      const needsConfirmation = data.user && data.user.identities && data.user.identities.length > 0 && !data.user.email_confirmed_at;
      const isAutoConfirmed = data.user && (!data.user.identities || data.user.identities.length === 0);

      if (isAutoConfirmed) { // Likely local dev with auto-confirm on
          toast.success("Cadastro realizado com sucesso! (Auto-confirmado)");
          setSuccess(true); // Show success message, maybe redirect or offer login
      } else if (needsConfirmation) { // Standard flow requiring email confirmation
          setSuccess(true);
          toast.success("Cadastro iniciado! Verifique seu e-mail para confirmação.");
      } else { // Handle unexpected cases or already confirmed user scenario if needed
          console.warn("Unexpected registration state:", data);
          // Maybe treat as success or show a specific message
          setSuccess(true); 
          toast.info("Estado de cadastro inesperado, verifique seu e-mail ou tente logar.");
      }
      
    } catch (err) {
      console.error("Registration error:", err);
      let errorMessage = "Ocorreu um erro durante o cadastro.";
      if (err instanceof Error) {
          errorMessage = err.message;
      } else if (typeof err === 'string') {
          errorMessage = err;
      }
      // Keep specific error messages
      if (errorMessage.includes("User already registered")) {
          errorMessage = "Este e-mail já está cadastrado.";
      } else if (errorMessage.includes("Password should be at least 6 characters")) {
          errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      } else if (errorMessage.includes("Unable to validate email address")) {
           errorMessage = "Formato de e-mail inválido.";
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Return the JSX for the registration form/success message
  return (
      <div className="w-full max-w-sm space-y-8 px-4 py-20 mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Cadastre-se</h1>
          <p className="text-muted-foreground">
            Crie sua conta para gerenciar grupos esportivos
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
             {success ? (
               <div className="bg-green-500/15 p-4 rounded-md flex flex-col items-center gap-y-2 text-sm text-green-700">
                 <CheckCircle className="h-6 w-6 mb-2" />
                 <p className="font-semibold">Cadastro iniciado com sucesso!</p>
                 <p className="text-center">Enviamos um link de confirmação para o seu e-mail ({email}). Por favor, verifique sua caixa de entrada (e spam).</p>
                 <Button variant="link" size="sm" className="mt-2 text-green-700" asChild>
                    <Link href="/login">Ir para Login</Link>
                 </Button>
               </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Error display */} 
                {error && (
                    <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                    </div>
                )}
                {/* Form fields remain the same */}
                 <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" type="text" placeholder="Seu nome" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input id="lastName" type="text" placeholder="Seu sobrenome" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={loading} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="seu@email.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input id="password" type="password" placeholder="Pelo menos 6 caracteres" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar senha</Label>
                    <Input id="confirmPassword" type="password" placeholder="Repita a senha" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} required />
                </div>
                {/* Submit Button */} 
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {loading ? 'Cadastrando...' : 'Criar Conta'}
                </Button>
              </form>
             )}
          </CardContent>
          {/* Footer with link to login */} 
           {!success && (
            <CardFooter className="flex justify-center border-t p-4">
                <p className="text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link href="/login" className="text-primary hover:underline">Entrar</Link>
                </p>
            </CardFooter>
           )}
        </Card>
      </div>
  );
}

// Main page component now wraps RegisterContent with Suspense
export default function RegisterPage() {
  return (
    <MobileLayout>
      <Suspense fallback={<RegisterFormSkeleton />}>
        <RegisterContent />
      </Suspense>
    </MobileLayout>
  );
}
