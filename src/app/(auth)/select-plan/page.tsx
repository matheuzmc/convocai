import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Check } from "lucide-react";

export default function SelectPlanPage() {
  return (
    <MobileLayout>
      <div className="w-full max-w-sm space-y-8 px-4 py-20 mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Escolha seu plano</h1>
          <p className="text-muted-foreground">
            Selecione o plano que melhor atende suas necessidades
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="relative overflow-hidden border-primary/20">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
            <CardHeader className="pb-2">
              <h3 className="text-xl font-bold">Plano Gratuito</h3>
              <CardDescription className="text-sm text-muted-foreground">
                Ideal para atletas e grupos casuais.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="mb-4">
                <span className="text-3xl font-bold">R$ 0</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>1 grupo esportivo</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Eventos ilimitados</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Notificações básicas</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full" variant="outline" asChild>
                <Link href="/events">Selecionar Gratuito</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="relative overflow-hidden border-primary">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                Recomendado
              </span>
            </div>
            <CardHeader className="pb-2">
              <h3 className="text-xl font-bold">Plano Premium</h3>
              <CardDescription className="text-sm text-muted-foreground">
                Para entusiastas de esportes
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="mb-4">
                <span className="text-3xl font-bold">R$ 19,90</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium">Grupos ilimitados</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Eventos ilimitados</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Notificações avançadas</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Estatísticas detalhadas</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Suporte prioritário</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full" asChild>
                <Link href="/events">Selecionar Premium</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Você pode alterar seu plano a qualquer momento nas configurações da sua conta.
        </p>
      </div>
    </MobileLayout>
  );
}
