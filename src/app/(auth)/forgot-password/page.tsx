import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <MobileLayout className="flex flex-col justify-center items-center py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Recuperar Senha</h1>
          <p className="text-muted-foreground">
            Enviaremos um link para redefinir sua senha
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                />
              </div>
              <Button className="w-full">
                Enviar link de recuperação
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4">
            <Link
              href="/login"
              className="text-sm text-primary hover:underline flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar para o login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </MobileLayout>
  );
}
