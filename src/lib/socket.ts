"use client";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080/";

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      withCredentials: true,
      extraHeaders: {
        "ngrok-skip-browser-warning": "true",
      },
    });
  }
  return socket;
}
