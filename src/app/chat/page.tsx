'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function ChatPageContent() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">FICCT Noticias</h1>
      <p className="mb-6">Bienvenido a FICCT Noticias. ¡Comienza tu conversación ahora!</p>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  );
}