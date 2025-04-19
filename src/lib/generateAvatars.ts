import { faker } from '@faker-js/faker/locale/pt_BR';
import fs from 'fs';
import path from 'path';

// Função para gerar URLs de avatares
export function generateAvatarUrls(count: number = 5): string[] {
  const avatars: string[] = [];
  
  for (let i = 1; i <= count; i++) {
    // Gerar URLs de avatares usando o faker
    avatars.push(faker.image.avatar());
  }
  
  return avatars;
}

// Função para gerar URLs de imagens de esportes
export function generateSportImages(count: number = 5): string[] {
  const sportImages: string[] = [];
  
  for (let i = 1; i <= count; i++) {
    // Gerar URLs de imagens de esportes usando o faker
    sportImages.push(faker.image.urlLoremFlickr({ category: 'sports' }));
  }
  
  return sportImages;
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

// Executar a função se este arquivo for executado diretamente
if (require.main === module) {
  saveImageUrlsToJson();
  console.log('URLs de imagens geradas e salvas com sucesso!');
}
