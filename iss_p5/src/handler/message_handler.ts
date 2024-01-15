import { Message } from "../shared_types/message";

export interface MessageHandler extends Handler<Message> {}