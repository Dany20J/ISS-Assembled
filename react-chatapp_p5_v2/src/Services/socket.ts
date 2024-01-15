import { io } from "socket.io-client";
export const ws = io("ws://localhost:3000");
