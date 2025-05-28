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
import { Sun, BellRing, AlertCircle } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isLightMode, setIsLightMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { 
    permissionStatus, 
    isNotificationsEnabled,
    isTokenActive,
    enableNotifications,
    disableNotifications,
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

  const handleThemeToggle = (checked: boolean) => {
    setIsLightMode(checked);
    setTheme(checked ? "light" : "dark");
  };

  const handlePushNotificationToggle = async (checked: boolean) => {
    if (checked) {
      const success = await enableNotifications();
      if (success) {
        toast.success("Notificações ativadas!");
      } else {
        toast.error("Não foi possível ativar as notificações. Veja as configurações do seu navegador.");
      }
    } else {
      const success = await disableNotifications();
      if (success) {
        toast.success("Notificações desativadas!");
        toast.info("Se quiser parar de receber notificações, bloqueie nas configurações do navegador.", {
          duration: 5000
        });
      } else {
        toast.error("Não foi possível desativar as notificações.");
      }
    }
  };

  if (!mounted) {
    return null;
  }

  const isNotificationSwitchEnabled = isNotificationsEnabled && isTokenActive;
  const isNotificationSwitchDisabled = permissionStatus === 'denied';

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
                  <Label htmlFor="notifications-push-toggle">Receber notificações</Label>
                  <p className="text-sm text-muted-foreground">
                    Ative para ser avisado sobre novidades e lembretes importantes.
                  </p>
                </div>
              </div>
              <Switch 
                id="notifications-push-toggle" 
                checked={isNotificationSwitchEnabled}
                onCheckedChange={handlePushNotificationToggle}
                disabled={isNotificationSwitchDisabled}
              />
            </div>

            {/* Mensagem informativa quando permissão foi negada */}
            {permissionStatus === 'denied' && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Notificações bloqueadas</p>
                  <p>As notificações estão bloqueadas no navegador. Para ativar, clique no cadeado ou ícone de informações ao lado do endereço do site e permita notificações.</p>
                </div>
              </div>
            )}

            {/* Mensagem informativa quando permissão foi concedida mas token não está ativo */}
            {permissionStatus === 'granted' && !isNotificationSwitchEnabled && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Notificações desativadas</p>
                  <p>Você pode ativar as notificações a qualquer momento usando o botão acima.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button className="w-full">
          Salvar configurações
        </Button>
      </div>
    </MobileLayout>
  );
}
