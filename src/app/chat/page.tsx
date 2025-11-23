'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

function ChatPageContent() {
  const { user } = useAuthStore();
  const router = useRouter();


  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">FICCT Noticias</h1>
          <p className="text-gray-600">Bienvenido, {user.email}</p>
        </div>
      </div>
      <p className="mb-6">¡Comienza tu conversación ahora!</p>
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