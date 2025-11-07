"use client"

import Chat from "@/components/chat";
import { useSocket } from "@/hooks/socket/useSocket";
import { useState } from "react";
import { useForm} from "react-hook-form";

export default function Home() {
  const [messages, setMessages] = useState<string>();
  const { register, handleSubmit } = useForm();

  const socket = useSocket();

   
  socket?.on("hello-world-message", (data) => {
    console.log(data);
    setMessages(data.mensaje);
  });

  return (
  //  < Chat/>
  <div>
    {messages}
    <form action="" onSubmit={handleSubmit((data) => {
      socket?.emit("hello-world", { message: data.message });
    })}>
      <input type="text" {...register("message")} />
      <button type="submit">Send</button>
    </form>
  </div>
  );
}