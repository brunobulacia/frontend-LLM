// Función de utilidad para limpiar completamente el estado de autenticación
// Puedes usar esto en la consola del navegador si tienes problemas

export function forceLogout() {
  // Limpiar localStorage
  localStorage.removeItem("auth-storage");

  // Limpiar cookies
  document.cookie =
    "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

  // Recargar la página para reinicializar el estado
  window.location.reload();
}

// Hacer disponible globalmente para debugging
if (typeof window !== "undefined") {
  (window as any).forceLogout = forceLogout;
}
