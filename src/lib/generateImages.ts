// URLs fixas de imagens públicas para os esportes
const SPORT_IMAGES = {
  futebol: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1000&q=80",
  basquete: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1000&q=80",
  vôlei: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1000&q=80",
  corrida: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=1000&q=80",
  ciclismo: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=1000&q=80",
  natação: "https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=1000&q=80",
  tênis: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1000&q=80",
  handebol: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1000&q=80",
  futsal: "https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?auto=format&fit=crop&w=1000&q=80",
  beach_tennis: "https://images.unsplash.com/photo-1613922421035-be8fe1b2b02f?auto=format&fit=crop&w=1000&q=80",
  outro: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1000&q=80"
};

// URLs fixas de avatares robustos para os usuários
const USER_AVATARS = [
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/22.jpg",
  "https://randomuser.me/api/portraits/women/65.jpg", 
  "https://randomuser.me/api/portraits/men/17.jpg",
  "https://randomuser.me/api/portraits/women/28.jpg",
  "https://randomuser.me/api/portraits/men/41.jpg",
  "https://randomuser.me/api/portraits/women/54.jpg",
  "https://randomuser.me/api/portraits/men/56.jpg",
  "https://randomuser.me/api/portraits/women/76.jpg"
];

// Função para obter URLs de avatares
export function getAvatarUrls(count: number = 5): string[] {
  return USER_AVATARS.slice(0, count);
}

// Função para obter URLs de imagens por esporte
export function getSportImageUrl(sport: string): string {
  return SPORT_IMAGES[sport as keyof typeof SPORT_IMAGES] || SPORT_IMAGES.outro;
}

// Função para obter uma amostra de imagens de esportes
export function getSportImages(count: number = 5): string[] {
  const sportKeys = Object.keys(SPORT_IMAGES);
  const result: string[] = [];
  
  for (let i = 0; i < Math.min(count, sportKeys.length); i++) {
    result.push(SPORT_IMAGES[sportKeys[i] as keyof typeof SPORT_IMAGES]);
  }
  
  return result;
}

// Função para gerar URL de imagem aleatória para um grupo
export function getRandomGroupImage(): string {
  const sportKeys = Object.keys(SPORT_IMAGES);
  const randomIndex = Math.floor(Math.random() * sportKeys.length);
  return SPORT_IMAGES[sportKeys[randomIndex] as keyof typeof SPORT_IMAGES];
}

// Função para gerar URLs de avatares
export function generateAvatarUrls(count: number = 5): string[] {
  const avatars: string[] = [];
  
  for (let i = 1; i <= count; i++) {
    // Gerar URLs de avatares usando randomuser.me
    const gender = i % 2 === 0 ? 'women' : 'men';
    const id = Math.floor(Math.random() * 70) + 1;
    avatars.push(`https://randomuser.me/api/portraits/${gender}/${id}.jpg`);
  }
  
  return avatars;
}

// Função para gerar URLs de imagens de esportes
export function generateSportImages(count: number = 5): string[] {
  const sportImages: string[] = [
    'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // futebol
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // basquete
    'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // vôlei
    'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // corrida
    'https://images.unsplash.com/photo-1541625602330-2277a4c46182?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'  // ciclismo
  ];
  
  return sportImages.slice(0, count);
}
