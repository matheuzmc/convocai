import fs from 'fs';
import path from 'path';

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

// Função para salvar as URLs em um arquivo JSON para referência
export function saveImageUrlsToJson() {
  const avatars = generateAvatarUrls();
  const sportImages = generateSportImages();
  
  const imageUrls = {
    avatars,
    sportImages
  };
  
  // Criar o diretório se não existir
  const dataDir = path.join(process.cwd(), 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Salvar as URLs em um arquivo JSON
  fs.writeFileSync(
    path.join(dataDir, 'imageUrls.json'),
    JSON.stringify(imageUrls, null, 2)
  );
  
  return imageUrls;
}
