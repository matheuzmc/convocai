import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HelpCircle, MessageCircle, FileText, Mail, Phone } from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  const faqs = [
    {
      question: "Como criar um novo grupo?",
      answer: "Para criar um novo grupo, acesse a seção 'Grupos' no menu inferior, toque no botão '+' ou 'Criar Grupo' e preencha as informações solicitadas como nome, descrição e tipo de esporte."
    },
    {
      question: "Como convidar pessoas para o meu grupo?",
      answer: "Dentro do seu grupo, acesse a seção 'Membros' e toque no botão 'Convidar'. Você pode compartilhar o link de convite gerado por WhatsApp, email ou outras plataformas."
    },
    {
      question: "Como criar um evento recorrente?",
      answer: "Ao criar um novo evento, marque a opção 'Evento recorrente' e selecione a frequência desejada (semanal, quinzenal ou mensal)."
    },
    {
      question: "Posso ter mais de um grupo no plano gratuito?",
      answer: "Não, o plano gratuito permite a criação de apenas um grupo. Para criar múltiplos grupos, é necessário fazer upgrade para o plano Premium."
    },
    {
      question: "Como confirmar presença em um evento?",
      answer: "Ao receber uma notificação de evento ou ao visualizar os detalhes de um evento, você verá botões para confirmar ou recusar sua presença."
    },
    {
      question: "Como alterar as configurações de notificação?",
      answer: "Acesse o menu, vá em 'Configurações' e na seção 'Notificações' você pode personalizar como deseja receber os alertas."
    },
  ];

  return (
    <MobileLayout
      header={<TopNav title="Ajuda e Suporte" backHref="/menu" />}
      footer={<BottomNav />}
    >
      <div className="space-y-6 p-4">
        <Tabs defaultValue="faq">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="contact">Contato</TabsTrigger>
            <TabsTrigger value="docs">Documentação</TabsTrigger>
          </TabsList>
          
          <TabsContent value="faq" className="mt-4 space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Perguntas Frequentes</h2>
              <p className="text-sm text-muted-foreground">
                Encontre respostas para as dúvidas mais comuns
              </p>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-medium flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-primary" />
                      {faq.question}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="contact" className="mt-4 space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Entre em Contato</h2>
              <p className="text-sm text-muted-foreground">
                Não encontrou o que procurava? Fale conosco
              </p>
            </div>
            
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Nome
                  </label>
                  <Input id="name" placeholder="Seu nome completo" />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input id="email" type="email" placeholder="seu@email.com" />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Assunto
                  </label>
                  <Input id="subject" placeholder="Assunto da mensagem" />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Mensagem
                  </label>
                  <Textarea 
                    id="message" 
                    placeholder="Descreva sua dúvida ou problema em detalhes"
                    rows={5}
                  />
                </div>
                
                <Button className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" /> Enviar Mensagem
                </Button>
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Outras formas de contato</h3>
              
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      suporte@sportsgroupapp.com
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Telefone</p>
                    <p className="text-sm text-muted-foreground">
                      (11) 3456-7890
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="docs" className="mt-4 space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Documentação</h2>
              <p className="text-sm text-muted-foreground">
                Guias e tutoriais para usar o aplicativo
              </p>
            </div>
            
            <div className="grid gap-4">
              <Card>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Guia de Início Rápido</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Aprenda os conceitos básicos para começar a usar o aplicativo.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="#">Ver guia</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Tutorial de Criação de Eventos</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Aprenda a criar e gerenciar eventos para seu grupo.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="#">Ver tutorial</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Gerenciando Membros</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Saiba como adicionar, remover e gerenciar membros do grupo.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="#">Ver guia</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}
