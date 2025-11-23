'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function TikTokPageContent() {
    const handleLoginTikTok = async () => {
        try {
            // Redirigir a la API route que maneja el login con TikTok
            window.location.href = '/api/tiktok/login';
        } catch (error) {
            console.error('Error al iniciar login con TikTok:', error);
        }
    };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">TikTok Integration</h1>
      <p className="mb-6">Conecta tu cuenta de TikTok para acceder a las funcionalidades de la API.</p>
      
      <div className="space-y-4">
        <button 
          onClick={handleLoginTikTok}
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Conectar con TikTok
        </button>
        
        <div className="text-sm text-gray-600">
          <p>Al conectar, podrás:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Subir videos a TikTok</li>
            <li>Publicar contenido</li>
            <li>Acceder a información básica del usuario</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function TikTokPage() {
  return (
    <ProtectedRoute>
      <TikTokPageContent />
    </ProtectedRoute>
  );
}