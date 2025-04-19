import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, CreditCard, Zap, Users, Calendar } from "lucide-react";
import { getCurrentUser } from "@/lib/mockData";
import Link from "next/link";

export default function PlansPage() {
  // Simulando dados do usuário
  const currentUser = getCurrentUser();
  
  const plans = [
    {
      id: "free",
      name: "Plano Gratuito",
      price: "R$ 0",
      period: "para sempre",
      features: [
        { text: "1 grupo esportivo", included: true },
        { text: "Até 20 membros por grupo", included: true },
        { text: "Eventos ilimitados", included: true },
        { text: "Notificações básicas", included: true },
        { text: "Suporte por email", included: true },
        { text: "Múltiplos grupos", included: false },
        { text: "Membros ilimitados", included: false },
        { text: "Estatísticas avançadas", included: false },
      ],
      current: !currentUser.isPremium,
    },
    {
      id: "premium",
      name: "Plano Premium",
      price: "R$ 19,90",
      period: "por mês",
      features: [
        { text: "Grupos ilimitados", included: true },
        { text: "Membros ilimitados por grupo", included: true },
        { text: "Eventos ilimitados", included: true },
        { text: "Notificações avançadas", included: true },
        { text: "Suporte prioritário", included: true },
        { text: "Estatísticas avançadas", included: true },
        { text: "Personalização de grupo", included: true },
        { text: "Exportação de dados", included: true },
      ],
      current: currentUser.isPremium,
    }
  ];

  return (
    <MobileLayout
      header={<TopNav title="Planos e Assinatura" backHref="/menu" />}
      footer={<BottomNav />}
    >
      <div className="space-y-6">
        <div className="text-center py-2">
          <h2 className="text-xl font-semibold">Escolha seu plano</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione o plano que melhor atende às suas necessidades
          </p>
        </div>

        <div className="space-y-4">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`${plan.current ? 'border-primary' : ''}`}
            >
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">{plan.name}</h3>
                  {plan.current && (
                    <Badge variant="outline" className="border-primary text-primary">
                      Plano Atual
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">
                    {plan.period}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={feature.included ? "" : "text-muted-foreground"}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
                
                {plan.current ? (
                  <Button variant="outline" className="w-full" disabled>
                    Plano Atual
                  </Button>
                ) : (
                  <Button className="w-full">
                    {plan.id === "free" ? "Fazer Downgrade" : "Fazer Upgrade"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {currentUser.isPremium && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="text-lg font-medium">Detalhes da Assinatura</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plano</span>
                  <span>Premium</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor</span>
                  <span>R$ 19,90/mês</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Próxima cobrança</span>
                  <span>15/05/2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método de pagamento</span>
                  <span className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-1" /> •••• 4242
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/plans/payment-method">
                    Alterar pagamento
                  </Link>
                </Button>
                <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                  Cancelar assinatura
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Benefícios do Plano Premium</h3>
          
          <div className="grid gap-4">
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Grupos Ilimitados</h4>
                  <p className="text-sm text-muted-foreground">
                    Crie e gerencie quantos grupos esportivos quiser sem limitações.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Membros Ilimitados</h4>
                  <p className="text-sm text-muted-foreground">
                    Adicione quantos membros quiser em cada grupo sem restrições.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Estatísticas Avançadas</h4>
                  <p className="text-sm text-muted-foreground">
                    Acesse relatórios detalhados sobre participação e desempenho.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
