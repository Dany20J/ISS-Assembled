import { useContext, useRef, useState } from "react";
import { MediatorContext } from "../../Contexts/mediator";
import { UserContext } from "../../Contexts/userContext";

import { Contact } from "../../Interfaces/contacts";
import ChatMessage from "./ChatMessage";

function ChatBox(props: { contact: Contact; setContact: any }) {
  // const [messages, setMessages] = useState<string[]>([]);
  // const currentUserPhone = useContext(UserContext);
  const mediator = useContext(MediatorContext);

  const chatBoxDiv = useRef<any>();
  const [formValue, setFormValue] = useState<string>("");

  const sendMessage = (e: any) => {
    e.preventDefault();

    mediator?.sendMessage({
      message: formValue,
      sendToPhoneNumber: props.contact.contactNumber,
    });
    // let temp = [...props.contact.messages];
    // temp.push({ messageBody: formValue, senderPhone: currentUserPhone });
    // props.setContact({
    //   messages: temp,
    //   contactNumber: props.contact.contactNumber,
    // });

    chatBoxDiv.current.scrollTo({
      top: chatBoxDiv.current.scrollHeight,
      behavior: "smooth",
    });

    setFormValue("");
  };

  return (
    <>
      <div className="card">
        <div
          ref={chatBoxDiv}
          className="card-body overflow-auto"
          style={{ position: "relative", height: "400px" }}
        >
          {props.contact.messages.map((msg, i) => (
            <ChatMessage
              text={msg.messageBody}
              isSender={msg.isSender}
              key={i}
            ></ChatMessage>
          ))}
        </div>
        <div className="card-footer text-muted d-flex justify-content-start align-items-center p-3">
          <div className="input-group mb-0">
            <input
              onChange={(e) => setFormValue(e.target.value)}
              type="text"
              value={formValue}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(e)}
              className="form-control"
              placeholder="Type message"
            />
            <button
              className="btn btn-primary"
              type="button"
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ChatBox;
