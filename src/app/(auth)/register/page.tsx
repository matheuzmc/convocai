'use client';

import React, { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { createClient } from '@/lib/supabase/client';
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const supabase = createClient();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: name, 
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user && data.user.identities && data.user.identities.length === 0) {
          toast.success("Cadastro realizado com sucesso! Redirecionando...");
          setSuccess(true);
      } else {
          setSuccess(true);
          toast.success("Cadastro iniciado! Verifique seu e-mail para confirmação.");
      }
      
    } catch (err) {
      console.error("Registration error:", err);
      let errorMessage = "Ocorreu um erro durante o cadastro.";
      if (err instanceof Error) {
          errorMessage = err.message;
      } else if (typeof err === 'string') {
          errorMessage = err;
      }
      if (errorMessage.includes("User already registered")) {
          errorMessage = "Este e-mail já está cadastrado.";
      } else if (errorMessage.includes("Password should be at least 6 characters")) {
          errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout>
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
                {error && (
                    <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    required
                    />
                </div>
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
                    <Label htmlFor="password">Senha</Label>
                    <Input
                    id="password"
                    type="password"
                    placeholder="Pelo menos 6 caracteres"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar senha</Label>
                    <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {loading ? 'Cadastrando...' : 'Criar Conta'}
                </Button>
                </form>
            )}
          </CardContent>
          {!success && (
            <CardFooter className="flex justify-center border-t p-4">
                <p className="text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link
                    href="/login"
                    className="text-primary hover:underline"
                >
                    Entrar
                </Link>
                </p>
            </CardFooter>
           )} 
        </Card>
      </div>
    </MobileLayout>
  );
}
