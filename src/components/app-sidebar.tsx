"use client"

import { Plus } from "lucide-react";

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
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { getChats, createChat } from "@/api/chats";
import { Chat } from "@/types/chats";
import { useRouter } from "next/navigation";

export function AppSidebar() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

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
  }

  const handleCreateChat = async () => {
    const chatName = prompt("Ingresá el nombre del nuevo chat:");
    
    if (!chatName || chatName.trim() === "") {
      return;
    }

    try {
      setIsCreating(true);
      const newChat = await createChat(chatName.trim());
      setChats(prev => [newChat, ...prev]);
      router.push(`/chat/${newChat.id}`);
    } catch (error) {
      console.error("Error al crear chat:", error);
      alert("Error al crear el chat. Por favor, intentá de nuevo.");
    } finally {
      setIsCreating(false);
    }
  }


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
          <SidebarGroupLabel className="text-2xl font-bold px-2 py-6">Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton asChild onClick={() => handleChatClick(chat.id)}>
                      <div className="text-xl font-medium cursor-pointer py-4">{chat.nombre}</div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
