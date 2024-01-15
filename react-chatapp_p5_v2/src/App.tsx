import "./App.css";
import { useState, useEffect } from "react";
import { Client } from "./mediator/client";
import { StateGUIMediator } from "./mediator/state_gui_mediator/state_gui_mediator";
import { Routes, Route, useNavigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import { MediatorContext } from "./Contexts/mediator";
import ChatPage from "./pages/ChatPage";
import { Contact } from "./Interfaces/contacts";
import { Reply } from "./mediator/shared_types/external_replies/reply";
import { AllChatState } from "./mediator/shared_types/chat_message_state";
import { Message } from "./Interfaces/Message";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [mediator, setMediator] = useState<StateGUIMediator>();
  const [contacts, setContacts] = useState<Contact[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    let client = new Client();
    let med = new StateGUIMediator(client);
    med.callbacks.loginSuccessCallback = loginSuccessCallback;
    med.callbacks.refreshChatStateCallback = chatStateCallback;
    med.callbacks.signUpCallback = signUpSuccessCallback;
    med.callbacks.sendMessageCallback = sendMessageReplyCallback;
    setMediator(med);
    client.connect();
  }, []);

  function sendMessageReplyCallback(reply: Reply) {
    if (!reply.successful) {
      toast("This Contact Doesn't Exists!");
    }
  }

  function signUpSuccessCallback(reply: Reply) {
    if (reply.successful) navigate("/logIn");
    else {
      toast("SignUp Error");
      console.log(reply.error);
    }
  }

  function loginSuccessCallback(reply: Reply) {
    if (reply.successful) navigate("/chat");
    else {
      toast("Login Error");
      console.log(reply.error);
    }
  }

  function chatStateCallback(chats: AllChatState, myPhone: string) {
    console.log("chatList number", chats.chatList.length);
    console.log(chats)
    const contacts = chats.chatList.map((chat) => {
      return {
        contactNumber: chat.otherPhoneNumber,
        messages: chat.chatMessagesList.map((message) => {
          return {
            messageBody: message.message,
            isSender: chat.yourPhoneNumber === message.senderPhoneNumber,
          } as Message;
        }),
      } as Contact;
    });
    console.log("contacts number", contacts.length);
    setContacts(contacts);
  }

  return (
    <MediatorContext.Provider value={mediator}>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/logIn" element={<LoginPage />} />
        <Route path="/signUp" element={<SignUpPage />} />
        <Route
          path="/chat"
          element={<ChatPage contacts={contacts} setContacts={setContacts} />}
        />
        <Route path="*" element={<h1>No PAGE</h1>} />
      </Routes>
      <ToastContainer />
    </MediatorContext.Provider>
  );
}

export default App;
