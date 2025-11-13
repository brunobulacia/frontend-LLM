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

export default function Chat({ mensajes }: { mensajes: Mensaje[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset } = useForm<{ message: string }>();

  
/*   if (mensajes) {
    setMessages(mensajes.map(msg => ({
      id: msg.id,
      content: msg.contenido,
      sender: msg.emisor === "USUARIO" ? "user" : "bot",
      timestamp: msg.createdAt,
    })));
  } */

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    let streamTimeout: NodeJS.Timeout;

    socket.on("prompt-response", (data) => {
      setIsTyping(false);
      
      setMessages(prev => {
        // Si el último mensaje es del bot y está siendo actualizado
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.sender === 'bot' && lastMessage.isStreaming) {
          // Actualizar el último mensaje del bot
          return prev.map((msg, index) => 
            index === prev.length - 1 
              ? { ...msg, content: data.respuesta }
              : msg
          );
        } else {
          // Crear un nuevo mensaje del bot
          return [...prev, {
            id: Date.now().toString(),
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
      }, 1000); // 1 segundo después de la última actualización
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

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: data.message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    // Send to socket
    socket.emit("prompt", { prompt: data.message });
    
    // Reset form
    reset();
  };

  return (
    <div className="chat-container flex flex-col h-screen max-w-4xl mx-auto bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">FICCT Noticias</h1>
        <p className="text-sm text-gray-500">Ingresá la Noticia/Anuncio que deseás publicar</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-lg">Iniciá con una Noticia o Anuncio</p>
            <p className="text-sm">Escribí una Noticia/Anuncio a continuación para comenzar a generar contenido.</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.sender === 'user' 
                ? 'bg-blue-500 text-white rounded-br-sm' 
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
            }`}>
              <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
              {message.isStreaming && (
                <div className="flex items-center mt-1">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-xs text-gray-400 ml-2">escribiendo...</span>
                </div>
              )}
              <p className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="bg-white border-t border-gray-200 p-4 safe-area-inset-bottom">
        <form onSubmit={handleSubmit(onSubmit)} className="flex space-x-2">
          <input
            type="text"
            {...register("message", { required: true })}
            placeholder="Escribí tu noticia o anuncio..."
            className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={isTyping}
            className="px-4 sm:px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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