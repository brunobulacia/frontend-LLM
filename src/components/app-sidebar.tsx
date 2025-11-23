"use client";

import { Plus, Trash2 } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { getChats, createChat, deleteChat } from "@/api/chats";
import { Chat } from "@/types/chats";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export function AppSidebar() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const { logout, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setIsLoading(true);
        const data = await getChats();
        setChats(data);
      } catch (error) {
        console.error("Error al cargar chats:", error);
        setChats([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, []);

  const handleChatClick = (chatId: string) => {
    console.log("Chat seleccionado:", chatId);
    router.push(`/chat/${chatId}`);
  };

  const handleCreateChat = async () => {
    const chatName = prompt("Ingresá el nombre del nuevo chat:");

    if (!chatName || chatName.trim() === "") {
      return;
    }

    try {
      setIsCreating(true);
      const newChat = await createChat(chatName.trim());
      setChats((prev) => [newChat, ...prev]);
      router.push(`/chat/${newChat.id}`);
    } catch (error) {
      console.error("Error al crear chat:", error);
      alert("Error al crear el chat. Por favor, intentá de nuevo.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteChat = async (
    chatId: string,
    chatName: string,
    event: React.MouseEvent
  ) => {
    // Prevenir que se active el click del chat
    event.stopPropagation();

    const confirmDelete = confirm(
      `¿Estás seguro de que querés eliminar el chat "${chatName}"?`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingChatId(chatId);
      await deleteChat(chatId);

      // Remover el chat de la lista
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));

      // Si estamos en el chat que se eliminó, redirigir al home
      if (window.location.pathname === `/chat/${chatId}`) {
        router.push("/");
      }

      console.log(`Chat "${chatName}" eliminado exitosamente`);
    } catch (error) {
      console.error("Error al eliminar chat:", error);
      alert("Error al eliminar el chat. Por favor, intentá de nuevo.");
    } finally {
      setDeletingChatId(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <button
          onClick={handleCreateChat}
          disabled={isCreating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          <Plus size={20} />
          {isCreating ? "Creando..." : "Nuevo Chat"}
        </button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-2xl font-bold px-2 py-6">
            Chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <div className="flex items-center justify-between group hover:bg-gray-100 rounded-lg transition-colors">
                    <SidebarMenuButton
                      asChild
                      onClick={() => handleChatClick(chat.id)}
                      className="flex-1"
                    >
                      <div className="text-xl font-medium cursor-pointer py-4 px-2">
                        {chat.nombre}
                      </div>
                    </SidebarMenuButton>

                    <button
                      onClick={(e) => handleDeleteChat(chat.id, chat.nombre, e)}
                      disabled={deletingChatId === chat.id}
                      className="opacity-0 group-hover:opacity-100 p-2 mr-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title={`Eliminar chat "${chat.nombre}"`}
                    >
                      {deletingChatId === chat.id ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 text-sm text-gray-600">
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Cerrar Sesión
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
