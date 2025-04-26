"use client";

import React, { useEffect } from "react";
import { useTheme } from "next-themes";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BellRing, Smartphone, Sun } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isLightMode, setIsLightMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLightMode(theme === "light");
  }, [theme]);

  const handleThemeToggle = (checked: boolean) => {
    setIsLightMode(checked);
    setTheme(checked ? "light" : "dark");
  };

  if (!mounted) {
    return null;
  }

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
                  <Label htmlFor="dark-mode">Modo claro</Label>
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
                  <Label htmlFor="notifications">Notificações push</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações de eventos
                  </p>
                </div>
              </div>
              <Switch 
                id="notifications" 
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                <div>
                  <Label htmlFor="vibration">Vibração</Label>
                  <p className="text-sm text-muted-foreground">
                    Vibrar ao receber notificações
                  </p>
                </div>
              </div>
              <Switch id="vibration" defaultChecked />
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
