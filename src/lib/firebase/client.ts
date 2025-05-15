import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging } from 'firebase/messaging';

// TODO: Substitua estas variáveis de ambiente pelos valores do seu firebaseConfig
// É altamente recomendável usar variáveis de ambiente para essas chaves em um arquivo .env.local
// e prefixá-las com NEXT_PUBLIC_ para que fiquem disponíveis no browser.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const getFirebaseMessaging = (): Messaging | null => {
  // Verifica se estamos no navegador antes de tentar acessar o getMessaging
  // e se o firebaseConfig está minimamente preenchido (ex: projectId)
  if (typeof window !== 'undefined' && firebaseConfig.projectId) {
    return getMessaging(app);
  }
  return null;
};

export { app, getFirebaseMessaging }; 