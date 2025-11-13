"use client"

import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { getChats } from "@/api/chats";
import { Chat } from "@/types/chats";
import { useRouter } from "next/navigation";

export function AppSidebar() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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


  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton asChild onClick={() => handleChatClick(chat.id)}>
                      <div className="inline">{chat.nombre}</div>
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
