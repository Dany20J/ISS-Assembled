import { Message } from "./Message";

export interface Contact {
  contactNumber: string;
  // chat: Chat;
  messages: Message[];
}
