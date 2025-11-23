import { useAuth } from "@/store/auth.store";

export function AuthStatus() {
  const { isLoggedIn, user, accessToken, logout } = useAuth();

  if (!isLoggedIn) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>No autenticado</p>
      </div>
    );
  }

  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
      <h3 className="font-bold mb-2">Estado de Autenticación</h3>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>ID:</strong> {user.id}</p>
      <p><strong>Token:</strong> {accessToken ? "✓ Válido" : "✗ No válido"}</p>
      <button 
        onClick={logout}
        className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
      >
        Cerrar Sesión
      </button>
    </div>
  );
}