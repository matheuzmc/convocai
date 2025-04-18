import { getSportImageUrl } from './generateImages';

// Tipos de dados
export interface User {
  id: string;
  name: string;
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
  description: string;
  sport: SportType;
  image: string;
  createdBy: string; // ID do usuário criador
  admins: string[]; // IDs dos administradores
  members: string[]; // IDs dos membros
  events: string[]; // IDs dos eventos
  createdAt: string;
}

export interface Event {
  id: string;
  groupId: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  isPeriodic: boolean;
  frequency?: 'weekly' | 'biweekly' | 'monthly';
  notifyBefore: number; // Horas antes para notificar
  attendees: {
    userId: string;
    status: 'confirmed' | 'declined' | 'pending';
  }[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'event' | 'invite' | 'system';
  relatedId?: string; // ID do evento ou convite relacionado
  isRead: boolean;
  createdAt: string;
}

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

// Dados mockados de usuários
export const users: User[] = [
  {
    id: 'user1',
    name: 'Carlos Silva',
    email: 'carlos.silva@exemplo.com',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    isPremium: true,
    groups: ['group1', 'group2', 'group3'],
    createdGroups: ['group1', 'group3'],
    sportPreferences: [
      { sport: 'futebol', position: 'Meio-campo' },
      { sport: 'basquete', position: 'Ala' },
      { sport: 'corrida', position: 'Fundista' }
    ]
  },
  {
    id: 'user2',
    name: 'Ana Oliveira',
    email: 'ana.oliveira@exemplo.com',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    isPremium: false,
    groups: ['group1', 'group4'],
    createdGroups: ['group4'],
    sportPreferences: [
      { sport: 'vôlei', position: 'Levantadora' },
      { sport: 'futebol', position: 'Zagueira' }
    ]
  },
  {
    id: 'user3',
    name: 'Pedro Santos',
    email: 'pedro.santos@exemplo.com',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    isPremium: false,
    groups: ['group1', 'group2'],
    createdGroups: [],
    sportPreferences: [
      { sport: 'futebol', position: 'Goleiro' },
      { sport: 'basquete', position: 'Pivô' }
    ]
  },
  {
    id: 'user4',
    name: 'Mariana Costa',
    email: 'mariana.costa@exemplo.com',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    isPremium: true,
    groups: ['group2', 'group5'],
    createdGroups: ['group2', 'group5'],
    sportPreferences: [
      { sport: 'ciclismo', position: 'Ciclista de estrada' },
      { sport: 'natação', position: 'Nado livre' },
      { sport: 'corrida', position: 'Velocista' }
    ]
  },
  {
    id: 'user5',
    name: 'Lucas Mendes',
    email: 'lucas.mendes@exemplo.com',
    avatar: 'https://randomuser.me/api/portraits/men/17.jpg',
    isPremium: false,
    groups: ['group3', 'group5'],
    createdGroups: [],
    sportPreferences: [
      { sport: 'ciclismo', position: 'Mountain bike' },
      { sport: 'corrida', position: 'Maratonista' }
    ]
  }
];

// Dados mockados de grupos
export const groups: Group[] = [
  {
    id: 'group1',
    name: 'Futebol dos Amigos',
    description: 'Grupo para organizar partidas de futebol semanais entre amigos',
    sport: 'futebol',
    image: getSportImageUrl('futebol'),
    createdBy: 'user1',
    admins: ['user1'],
    members: ['user1', 'user2', 'user3'],
    events: ['event1', 'event2', 'event3'],
    createdAt: '2025-01-15T10:30:00Z'
  },
  {
    id: 'group2',
    name: 'Basquete da Quadra Central',
    description: 'Grupo para jogos de basquete na quadra do parque central',
    sport: 'basquete',
    image: getSportImageUrl('basquete'),
    createdBy: 'user4',
    admins: ['user4'],
    members: ['user1', 'user3', 'user4'],
    events: ['event4', 'event5'],
    createdAt: '2025-02-10T14:45:00Z'
  },
  {
    id: 'group3',
    name: 'Corrida Matinal',
    description: 'Grupo para corridas matinais no parque da cidade',
    sport: 'corrida',
    image: getSportImageUrl('corrida'),
    createdBy: 'user1',
    admins: ['user1', 'user5'],
    members: ['user1', 'user5'],
    events: ['event6'],
    createdAt: '2025-03-05T08:15:00Z'
  },
  {
    id: 'group4',
    name: 'Vôlei de Praia',
    description: 'Grupo para jogar vôlei de praia nos finais de semana',
    sport: 'vôlei',
    image: getSportImageUrl('vôlei'),
    createdBy: 'user2',
    admins: ['user2'],
    members: ['user2'],
    events: ['event7'],
    createdAt: '2025-03-20T16:30:00Z'
  },
  {
    id: 'group5',
    name: 'Ciclismo Urbano',
    description: 'Grupo para passeios de bicicleta pela cidade',
    sport: 'ciclismo',
    image: getSportImageUrl('ciclismo'),
    createdBy: 'user4',
    admins: ['user4'],
    members: ['user4', 'user5'],
    events: ['event8', 'event9'],
    createdAt: '2025-04-01T09:00:00Z'
  }
];

// Dados mockados de eventos
export const events: Event[] = [
  {
    id: 'event1',
    groupId: 'group1',
    title: 'Futebol de Quarta',
    description: 'Partida semanal de futebol society',
    location: 'Quadra Society do Parque Municipal',
    date: '2025-04-23',
    time: '19:00',
    isPeriodic: true,
    frequency: 'weekly',
    notifyBefore: 24,
    attendees: [
      { userId: 'user1', status: 'confirmed' },
      { userId: 'user2', status: 'confirmed' },
      { userId: 'user3', status: 'pending' }
    ],
    createdAt: '2025-04-10T14:30:00Z'
  },
  {
    id: 'event2',
    groupId: 'group1',
    title: 'Futebol de Quarta',
    description: 'Partida semanal de futebol society',
    location: 'Quadra Society do Parque Municipal',
    date: '2025-04-30',
    time: '19:00',
    isPeriodic: true,
    frequency: 'weekly',
    notifyBefore: 24,
    attendees: [
      { userId: 'user1', status: 'confirmed' },
      { userId: 'user2', status: 'pending' },
      { userId: 'user3', status: 'pending' }
    ],
    createdAt: '2025-04-10T14:30:00Z'
  },
  {
    id: 'event3',
    groupId: 'group1',
    title: 'Futebol Especial de Feriado',
    description: 'Partida especial de futebol no feriado',
    location: 'Campo do Clube Esportivo',
    date: '2025-05-01',
    time: '10:00',
    isPeriodic: false,
    notifyBefore: 48,
    attendees: [
      { userId: 'user1', status: 'confirmed' },
      { userId: 'user2', status: 'confirmed' },
      { userId: 'user3', status: 'confirmed' }
    ],
    createdAt: '2025-04-15T09:45:00Z'
  },
  {
    id: 'event4',
    groupId: 'group2',
    title: 'Basquete de Sábado',
    description: 'Jogo de basquete 3x3',
    location: 'Quadra do Parque Central',
    date: '2025-04-26',
    time: '16:00',
    isPeriodic: true,
    frequency: 'weekly',
    notifyBefore: 24,
    attendees: [
      { userId: 'user1', status: 'confirmed' },
      { userId: 'user3', status: 'confirmed' },
      { userId: 'user4', status: 'confirmed' }
    ],
    createdAt: '2025-04-12T11:20:00Z'
  },
  {
    id: 'event5',
    groupId: 'group2',
    title: 'Treino de Arremessos',
    description: 'Treino focado em arremessos de 3 pontos',
    location: 'Quadra do Parque Central',
    date: '2025-04-29',
    time: '18:00',
    isPeriodic: false,
    notifyBefore: 12,
    attendees: [
      { userId: 'user3', status: 'confirmed' },
      { userId: 'user4', status: 'confirmed' }
    ],
    createdAt: '2025-04-20T16:15:00Z'
  },
  {
    id: 'event6',
    groupId: 'group3',
    title: 'Corrida de Domingo',
    description: 'Corrida leve de 5km pelo parque',
    location: 'Entrada Principal do Parque da Cidade',
    date: '2025-04-27',
    time: '07:00',
    isPeriodic: true,
    frequency: 'weekly',
    notifyBefore: 12,
    attendees: [
      { userId: 'user1', status: 'confirmed' },
      { userId: 'user5', status: 'confirmed' }
    ],
    createdAt: '2025-04-18T08:30:00Z'
  },
  {
    id: 'event7',
    groupId: 'group4',
    title: 'Vôlei de Domingo',
    description: 'Jogo de vôlei de praia',
    location: 'Praia do Leblon - Posto 10',
    date: '2025-04-27',
    time: '09:00',
    isPeriodic: true,
    frequency: 'biweekly',
    notifyBefore: 24,
    attendees: [
      { userId: 'user2', status: 'confirmed' }
    ],
    createdAt: '2025-04-19T10:45:00Z'
  },
  {
    id: 'event8',
    groupId: 'group5',
    title: 'Passeio Ciclístico',
    description: 'Passeio de bicicleta pela orla',
    location: 'Praça da Bicicleta',
    date: '2025-04-26',
    time: '08:00',
    isPeriodic: true,
    frequency: 'biweekly',
    notifyBefore: 24,
    attendees: [
      { userId: 'user4', status: 'confirmed' },
      { userId: 'user5', status: 'pending' }
    ],
    createdAt: '2025-04-15T14:00:00Z'
  },
  {
    id: 'event9',
    groupId: 'group5',
    title: 'Pedal Noturno',
    description: 'Passeio noturno de bicicleta pelo centro histórico',
    location: 'Praça Central',
    date: '2025-05-03',
    time: '20:00',
    isPeriodic: false,
    notifyBefore: 48,
    attendees: [
      { userId: 'user4', status: 'confirmed' },
      { userId: 'user5', status: 'confirmed' }
    ],
    createdAt: '2025-04-20T19:30:00Z'
  }
];

// Dados mockados de notificações
export const notifications: Notification[] = [
  {
    id: 'notif1',
    userId: 'user1',
    title: 'Evento se aproximando',
    message: 'Futebol de Quarta acontecerá amanhã às 19:00',
    type: 'event',
    relatedId: 'event1',
    isRead: false,
    createdAt: '2025-04-22T19:00:00Z'
  },
  {
    id: 'notif2',
    userId: 'user2',
    title: 'Evento se aproximando',
    message: 'Futebol de Quarta acontecerá amanhã às 19:00',
    type: 'event',
    relatedId: 'event1',
    isRead: true,
    createdAt: '2025-04-22T19:00:00Z'
  },
  {
    id: 'notif3',
    userId: 'user3',
    title: 'Evento se aproximando',
    message: 'Futebol de Quarta acontecerá amanhã às 19:00',
    type: 'event',
    relatedId: 'event1',
    isRead: false,
    createdAt: '2025-04-22T19:00:00Z'
  },
  {
    id: 'notif4',
    userId: 'user2',
    title: 'Convite para grupo',
    message: 'Carlos Silva convidou você para o grupo Corrida Matinal',
    type: 'invite',
    relatedId: 'group3',
    isRead: false,
    createdAt: '2025-04-21T10:15:00Z'
  },
  {
    id: 'notif5',
    userId: 'user5',
    title: 'Novo evento criado',
    message: 'Um novo evento foi criado no grupo Ciclismo Urbano: Pedal Noturno',
    type: 'event',
    relatedId: 'event9',
    isRead: true,
    createdAt: '2025-04-20T19:35:00Z'
  },
  {
    id: 'notif6',
    userId: 'user1',
    title: 'Confirmação de presença',
    message: 'Ana Oliveira confirmou presença no evento Futebol Especial de Feriado',
    type: 'event',
    relatedId: 'event3',
    isRead: true,
    createdAt: '2025-04-20T14:50:00Z'
  },
  {
    id: 'notif7',
    userId: 'user4',
    title: 'Novo membro no grupo',
    message: 'Lucas Mendes entrou no grupo Ciclismo Urbano',
    type: 'system',
    relatedId: 'group5',
    isRead: false,
    createdAt: '2025-04-19T16:20:00Z'
  }
];

// Funções auxiliares para manipulação dos dados mockados
export const getCurrentUser = () => users[0]; // Simula o usuário logado

export const getUserGroups = (userId: string) => {
  return groups.filter(group => group.members.includes(userId));
};

export const getGroupEvents = (groupId: string) => {
  return events.filter(event => event.groupId === groupId);
};

export const getUserNotifications = (userId: string) => {
  return notifications.filter(notification => notification.userId === userId);
};

export const getGroupById = (groupId: string) => {
  return groups.find(group => group.id === groupId);
};

export const getEventById = (eventId: string) => {
  return events.find(event => event.id === eventId);
};

export const getUserById = (userId: string) => {
  return users.find(user => user.id === userId);
};

export const getGroupMembers = (groupId: string) => {
  const group = getGroupById(groupId);
  if (!group) return [];
  return group.members.map(memberId => getUserById(memberId)).filter(Boolean) as User[];
};

export const getEventAttendees = (eventId: string) => {
  const event = getEventById(eventId);
  if (!event) return [];
  return event.attendees.map(attendee => ({
    user: getUserById(attendee.userId),
    status: attendee.status
  })).filter(item => item.user) as { user: User; status: 'confirmed' | 'declined' | 'pending' }[];
};

export const isGroupAdmin = (userId: string, groupId: string) => {
  const group = getGroupById(groupId);
  return group ? group.admins.includes(userId) : false;
};

export const canCreateGroup = (userId: string) => {
  const user = getUserById(userId);
  if (!user) return false;
  return user.isPremium || user.createdGroups.length < 1;
};
