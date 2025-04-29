"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, MapPin, Repeat, UploadCloud, Camera } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { toast } from "sonner";

export interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  isPeriodic: boolean;
  frequency: string | null;
  notifyBefore: string;
}

export interface GroupFormData {
  name: string;
  description: string;
  sport: string;
  image: string;
}

interface EventFormProps {
  onSubmit: (data: EventFormData) => void;
  initialData?: Partial<EventFormData>;
  isEdit?: boolean;
  isLoading?: boolean;
}

interface GroupFormProps {
  onSubmit: (data: GroupFormData) => void;
  initialData?: Partial<GroupFormData>;
  isEdit?: boolean;
  isLoading?: boolean;
  imagePreviewUrl: string | null;
  currentImageUrl: string | null;
  isUploadingImage: boolean;
  triggerFileInput: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function EventForm({ onSubmit, initialData, isEdit = false, isLoading = false }: EventFormProps) {
  const [isPeriodic, setIsPeriodic] = React.useState(initialData?.isPeriodic || false);
  const [frequency, setFrequency] = React.useState(initialData?.frequency || 'weekly');
  const [notifyBefore, setNotifyBefore] = React.useState(initialData?.notifyBefore || '24');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data: EventFormData = {
      title: String(formData.get('title') || ''),
      description: String(formData.get('description') || ''),
      date: String(formData.get('date') || ''),
      time: String(formData.get('time') || ''),
      location: String(formData.get('location') || ''),
      isPeriodic,
      frequency: isPeriodic ? frequency : null,
      notifyBefore,
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título do evento</Label>
          <Input
            id="title"
            name="title"
            placeholder="Ex: Partida de futebol"
            defaultValue={initialData?.title || ''}
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Detalhes sobre o evento"
            defaultValue={initialData?.description || ''}
            className="min-h-[100px]"
            disabled={isLoading}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="date"
                name="date"
                type="date"
                className="pl-9"
                defaultValue={initialData?.date || ''}
                disabled={isLoading}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Horário</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="time"
                name="time"
                type="time"
                className="pl-9"
                defaultValue={initialData?.time || ''}
                disabled={isLoading}
                required
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Local</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="location"
              name="location"
              placeholder="Endereço do evento"
              className="pl-9"
              defaultValue={initialData?.location || ''}
              disabled={isLoading}
              required
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label htmlFor="is-periodic">Evento recorrente</Label>
              <p className="text-xs text-muted-foreground">
                Repetir este evento periodicamente
              </p>
            </div>
          </div>
          <Switch 
            id="is-periodic" 
            checked={isPeriodic}
            onCheckedChange={setIsPeriodic}
            disabled={isLoading}
          />
        </div>
        
        {isPeriodic && (
          <div className="space-y-2 pl-6 border-l-2 border-muted">
            <Label htmlFor="frequency">Frequência</Label>
            <Select value={frequency} onValueChange={setFrequency} disabled={isLoading}>
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="biweekly">Quinzenal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="notify-before">Notificar membros</Label>
          <Select value={notifyBefore} onValueChange={setNotifyBefore} disabled={isLoading}>
            <SelectTrigger id="notify-before">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 hora antes</SelectItem>
              <SelectItem value="3">3 horas antes</SelectItem>
              <SelectItem value="6">6 horas antes</SelectItem>
              <SelectItem value="12">12 horas antes</SelectItem>
              <SelectItem value="24">24 horas antes</SelectItem>
              <SelectItem value="48">2 dias antes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Criando...' : (isEdit ? 'Salvar Alterações' : 'Criar Evento')}
      </Button>
    </form>
  );
}

export function GroupForm({ onSubmit, initialData, isEdit = false, isLoading = false, imagePreviewUrl, currentImageUrl, isUploadingImage, triggerFileInput, onFileChange, fileInputRef }: GroupFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data: Omit<GroupFormData, 'image'> & { image?: string } = {
      name: String(formData.get('name') || ''),
      description: String(formData.get('description') || ''),
      sport: String(formData.get('sport') || ''),
    };
    onSubmit(data as GroupFormData);
  };

  const displayImageUrl = imagePreviewUrl || currentImageUrl;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do grupo</Label>
          <Input
            id="name"
            name="name"
            placeholder="Ex: Futebol das Terças"
            defaultValue={initialData?.name || ''}
            disabled={isLoading || isUploadingImage}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Objetivo, regras, etc."
            defaultValue={initialData?.description || ''}
            className="min-h-[100px]"
            disabled={isLoading || isUploadingImage}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sport">Esporte Principal</Label>
          <Select name="sport" defaultValue={initialData?.sport || 'futebol'} disabled={isLoading || isUploadingImage}>
            <SelectTrigger id="sport">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="futebol">Futebol</SelectItem>
              <SelectItem value="basquete">Basquete</SelectItem>
              <SelectItem value="vôlei">Vôlei</SelectItem>
              <SelectItem value="futsal">Futsal</SelectItem>
              <SelectItem value="beach_tennis">Beach Tennis</SelectItem>
              <SelectItem value="tênis">Tênis</SelectItem>
              <SelectItem value="corrida">Corrida</SelectItem>
              <SelectItem value="ciclismo">Ciclismo</SelectItem>
              <SelectItem value="natação">Natação</SelectItem>
              <SelectItem value="handebol">Handebol</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Imagem do Grupo (Banner)</Label>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-dashed border-input flex items-center justify-center bg-muted/40">
            {isUploadingImage ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Skeleton className="h-12 w-12 rounded-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : displayImageUrl ? (
              <Image
                src={displayImageUrl}
                alt="Prévia da imagem do grupo"
                fill
                className="object-cover"
                unoptimized
                onError={() => {
                  if (imagePreviewUrl && displayImageUrl === imagePreviewUrl) {
                      toast.error("Erro ao carregar prévia da imagem.");
                  }
                }}
              />
            ) : (
              <div className="text-center text-muted-foreground p-4">
                <UploadCloud className="mx-auto h-10 w-10 mb-2" />
                <p className="text-sm">Nenhuma imagem selecionada</p>
                <p className="text-xs">Clique no ícone da câmera para adicionar</p>
              </div>
            )}

            {!isUploadingImage && (
              <button
                type="button"
                onClick={triggerFileInput}
                disabled={isLoading}
                className="absolute bottom-2 right-2 bg-background/80 hover:bg-background text-foreground rounded-full p-2 transition-colors duration-200 border border-border shadow-sm"
                aria-label="Alterar imagem do grupo"
              >
                <Camera className="h-5 w-5" />
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={onFileChange}
            className="hidden"
            disabled={isLoading || isUploadingImage}
          />
          <p className="text-xs text-muted-foreground">
            Opcional. Recomendado: formato paisagem (16:9).
          </p>
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading || isUploadingImage}>
        {isUploadingImage ? 'Enviando imagem...' : (isLoading ? (isEdit ? 'Salvando...' : 'Criando...') : (isEdit ? 'Salvar Alterações' : 'Criar Grupo'))}
      </Button>
    </form>
  );
}
