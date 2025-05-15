"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BellRing, Sun } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isLightMode, setIsLightMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { 
    requestPermissionAndGetToken, 
    permissionStatus, 
    fcmToken, 
    error: pushNotificationError
  } = usePushNotifications();

  useEffect(() => {
    setMounted(true);
    setIsLightMode(theme === "light");
  }, [theme]);

  useEffect(() => {
    if (pushNotificationError) {
      toast.error(`Erro nas notificações: ${pushNotificationError.message}`);
    }
  }, [pushNotificationError]);

  useEffect(() => {
    if (fcmToken && permissionStatus === 'granted') {
      // Poderia mostrar um toast de sucesso aqui, mas pode ser verboso.
      // console.log("Token FCM atualizado/registrado:", fcmToken);
      // toast.success("Notificações Push ativadas!"); // Descomente se desejar feedback explícito
    }
  }, [fcmToken, permissionStatus]);

  const handleThemeToggle = (checked: boolean) => {
    setIsLightMode(checked);
    setTheme(checked ? "light" : "dark");
  };

  const handlePushNotificationToggle = async (checked: boolean) => {
    if (checked) {
      if (permissionStatus !== 'granted') {
        await requestPermissionAndGetToken();
      } else {
        console.log("Notificações push já estavam ativadas.");
      }
    } else {
      toast.info("Para desativar completamente as notificações push, você precisa ajustar as permissões do site nas configurações do seu navegador.");
    }
  };

  if (!mounted) {
    return null;
  }

  const arePushNotificationsEnabled = permissionStatus === 'granted';

  return (
    <MobileLayout
      header={<TopNav title="Configurações" backHref="/menu" />}
      footer={<BottomNav />}
    >
      <div className="space-y-6 p-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="text-lg font-medium">Aparência</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                <div>
                  <Label htmlFor="theme-toggle">Modo claro</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar o tema claro
                  </p>
                </div>
              </div>
              <Switch 
                id="theme-toggle" 
                checked={isLightMode}
                onCheckedChange={handleThemeToggle}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="text-lg font-medium">Notificações</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="h-5 w-5" />
                <div>
                  <Label htmlFor="notifications-push-toggle">Notificações push</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações de eventos e atualizações
                  </p>
                </div>
              </div>
              <Switch 
                id="notifications-push-toggle" 
                checked={arePushNotificationsEnabled}
                onCheckedChange={handlePushNotificationToggle}
                disabled={permissionStatus === 'denied'}
              />
            </div>
          </CardContent>
        </Card>

        <Button className="w-full">
          Salvar configurações
        </Button>
      </div>
    </MobileLayout>
  );
}
