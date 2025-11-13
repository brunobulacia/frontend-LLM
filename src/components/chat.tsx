"use client"

import { useSocket } from "@/hooks/socket/useSocket";
import { Mensaje } from "@/types/mensajes";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatProps {
  mensajes: Mensaje[];
  chatId: string;
}

export default function Chat({ mensajes, chatId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset } = useForm<{ message: string }>();

  const socket = useSocket();

  //PARA CARGAR LOS MENSAJES VIA REST API CUANDO SE RECARGA LA PAGINA
  useEffect(() => {
    if (mensajes && mensajes.length > 0) {
      const formattedMessages = mensajes.map(msg => ({
        id: msg.id,
        content: msg.contenido,
        sender: msg.emisor === "USUARIO" ? "user" as const : "bot" as const,
        timestamp: new Date(msg.createdAt),
        isStreaming: false
      }));
      setMessages(formattedMessages);
    } else {
      // Si no hay mensajes (nuevo chat), limpiar
      setMessages([]);
    }
  }, [mensajes, chatId]); // Recargar cuando cambian mensajes o chatId

  // Manejar respuestas del WebSocket en tiempo real
  useEffect(() => {
    if (!socket) return;

    let streamTimeout: NodeJS.Timeout;

    socket.on("prompt-response", (data) => {
      setIsTyping(false);
      
      setMessages(prev => {
        // Si el último mensaje es del bot y está siendo actualizado (streaming)
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.sender === 'bot' && lastMessage.isStreaming) {
          // Actualizar el último mensaje del bot con el contenido nuevo
          return prev.map((msg, index) => 
            index === prev.length - 1 
              ? { ...msg, content: data.respuesta }
              : msg
          );
        } else {
          // Crear un nuevo mensaje del bot
          return [...prev, {
            id: `bot-${Date.now()}`, // ID único para mensajes en tiempo real
            content: data.respuesta,
            sender: 'bot',
            timestamp: new Date(),
            isStreaming: true
          }];
        }
      });

      // Limpiar timeout anterior y crear uno nuevo
      clearTimeout(streamTimeout);
      streamTimeout = setTimeout(() => {
        setMessages(prev => 
          prev.map((msg, index) => 
            index === prev.length - 1 && msg.sender === 'bot' 
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
      }, 1000); 
    });

    return () => {
      socket.off("prompt-response");
      clearTimeout(streamTimeout);
    };
  }, [socket]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const onSubmit = (data: { message: string }) => {
    if (!data.message.trim() || !socket) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: data.message,
      sender: 'user',
      timestamp: new Date(),
      isStreaming: false
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    

    //PA DEBUG EN EL NAVEGADOR 
    console.log("Enviando prompt:", data.message);
    // Enviar a través del WebSocket
    socket.emit("prompt", { chatId: chatId, prompt: data.message });
    
    // Limpiar formulario
    reset();
  };

  return (
    <div className="chat-container flex flex-col h-screen w-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">FICCT Noticias</h1>
        <p className="text-sm text-gray-500">Ingresá la Noticia/Anuncio que deseás publicar</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="w-full space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-lg font-medium">Iniciá con una Noticia o Anuncio</p>
              <p className="text-sm mt-2">Escribí una Noticia/Anuncio a continuación para comenzar a generar contenido.</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-6 py-4 rounded-2xl min-w-[100px] ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white rounded-br-sm max-w-[75%]' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm max-w-[85%]'
              }`}>
                <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
                {message.isStreaming && (
                  <div className="flex items-center mt-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-xs text-gray-400 ml-2">escribiendo...</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 border border-gray-200 px-5 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white border-t border-gray-200 p-4 md:p-6 lg:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="flex space-x-3 w-full max-w-full">
          <input
            type="text"
            {...register("message", { required: true })}
            placeholder="Escribí tu noticia o anuncio..."
            className="flex-1 px-5 py-3.5 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-full"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={isTyping}
            className="px-5 py-3.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}