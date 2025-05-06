export type SportType = 
  | 'futebol' 
  | 'basquete' 
  | 'vôlei' 
  | 'tênis' 
  | 'corrida' 
  | 'ciclismo' 
  | 'natação' 
  | 'handebol'
  | 'futsal'
  | 'beach_tennis'
  | 'outro';

// Tipos de dados
export interface User {
  id: string;
  name: string | null;
  lastName?: string | null;
  email: string;
  avatar: string;
  isPremium: boolean;
  groups: string[]; // IDs dos grupos que o usuário participa
  createdGroups: string[]; // IDs dos grupos que o usuário criou
  sportPreferences: {
    sport: SportType;
    position: string;
  }[];
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  sport: SportType;
  image: string;
  createdBy: string | null;
  admins: string[];
  members: string[];
  events: string[];
  createdAt: string;
  memberCount?: number;
  is_active: boolean;
}

export interface EventAttendee {
  userId: string;
  status: 'confirmed' | 'pending' | 'declined';
}

export interface Event {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  location: string | null;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM:SS
  isPeriodic: boolean;
  frequency?: 'weekly' | 'monthly' | null;
  notifyBefore?: number | null; // minutes before
  attendees: EventAttendee[];
  createdAt: string;
}

// Tipo para membro de grupo com dados básicos do perfil
export interface GroupMemberWithProfile {
  id: string; // ID do perfil (se existir, senão user_id)
  user_id: string; // Adicionar ID de autenticação (user_id)
  name: string | null;
  lastName?: string | null;
  nickname?: string | null;
  avatar: string | null;
  isAdmin: boolean;
  // Outros campos da relação group_members podem ser adicionados se necessário (ex: joined_at)
}

// Novo tipo para participante com perfil
export interface AttendeeWithProfile extends EventAttendee {
  profile: {
    name: string | null; // Nome completo (pode ser combinação de name+lastname no futuro?)
    lastName?: string | null;
    nickname?: string | null; // Apelido (opcional aqui)
    avatar_url: string | null;
  } | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

// Interface matching the UserProfile type in profile page
export interface UserProfileData {
  id: string;
  name: string | null;
  lastName?: string | null; // Padronizado para camelCase
  nickname?: string | null;
  avatar_url: string | null; // Manter snake_case pois é URL direta do storage?
  is_premium: boolean;
  sport_preferences: { sport: SportType; position: string }[] | null;
  phone_number: string | null; // Manter snake_case para consistência com DB?
} 