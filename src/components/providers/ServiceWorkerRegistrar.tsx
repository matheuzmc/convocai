'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    const registerServiceWorker = () => {
      navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
        .then(registration => {
          console.log('[ServiceWorkerRegistrar] Service Worker registrado com sucesso, escopo:', registration.scope);
        })
        .catch(registrationError => {
          console.error('[ServiceWorkerRegistrar] Falha ao registrar Service Worker:', registrationError);
        });
    };

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      if (document.readyState === 'complete') {
        registerServiceWorker();
      } else {
        window.addEventListener('load', registerServiceWorker);
      }
    } 
  }, []);

  return null;
} 