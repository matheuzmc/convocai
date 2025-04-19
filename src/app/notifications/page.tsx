import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NotificationCard } from "@/components/cards/NotificationMemberCards";
import { getCurrentUser, getUserNotifications } from "@/lib/mockData";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  // Simulando dados do usuário e notificações
  const currentUser = getCurrentUser();
  const notifications = getUserNotifications(currentUser.id);

  return (
    <MobileLayout
      header={<TopNav title="Notificações" backHref="/dashboard" />}
      footer={<BottomNav />}
    >
      <div className="space-y-6">
        {notifications.length === 0 ? (
          <div className="text-center py-10 space-y-4">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              Você não tem notificações no momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                id={notification.id}
                title={notification.title}
                message={notification.message}
                type={notification.type}
                isRead={notification.isRead}
                createdAt={notification.createdAt}
              />
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
