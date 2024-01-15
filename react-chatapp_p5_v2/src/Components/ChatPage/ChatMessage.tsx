import { useContext } from "react";
import { text } from "stream/consumers";
import { UserContext } from "../../Contexts/userContext";

function ChatMessage(props: { text: string; isSender: boolean }) {
  // const currentUserPhone = useContext(UserContext);
  const isSender = props.isSender;

  return (
    <>
      <div className={`d-flex ${isSender && "flex-row-reverse"}`}>
        <p
          className="small p-2 ms-3 mb-3 rounded-3"
          style={
            isSender
              ? { backgroundColor: "#0275d8", color: "white" }
              : { backgroundColor: "#f5f6f7" }
          }
        >
          {props.text}
        </p>
      </div>
    </>
  );
}

export default ChatMessage;
