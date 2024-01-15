/* eslint-disable jsx-a11y/anchor-is-valid */
import ChatBox from "../Components/ChatPage/ChatBox";
import "./ChatPage.css";
import { useEffect, useState, useRef, useContext } from "react";
import { ws } from "../Services/socket";
import { Contact } from "../Interfaces/contacts";
import { MediatorContext } from "../Contexts/mediator";

function ChatPage(props: {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}) {
  let activeAnchor = useRef<Element>();
  let addPhoneInput = useRef<any>();

  // const [phoneToAdd, setPhoneToAdd] = useState("");
  const [currentChat, setCurrentChat] = useState<Contact>();

  // useEffect(() => {
  //   let temp = props.contacts.map((contact) => {
  //     if (contact.contactNumber === currentChat?.contactNumber) {
  //       return currentChat;
  //     }
  //     return contact;
  //   });
  //   props.setContacts(temp);
  // }, [currentChat, props]);

  // useEffect(() => {
  //   const mockContacts: Contact[] = [];
  //   for (let i = 0; i < 5; i++) {
  //     let contact: Contact = {
  //       contactNumber: Math.random().toString(),
  //       messages: [
  //         {
  //           messageBody: Math.random().toString(36),
  //           senderPhone: "12345678", //to determine the color of message
  //         },
  //         {
  //           messageBody: Math.random().toString(36),
  //           senderPhone: "12412515",
  //         },
  //         {
  //           messageBody: Math.random().toString(36),
  //           senderPhone: "12412515",
  //         },
  //         {
  //           messageBody: Math.random().toString(36),
  //           senderPhone: "12412515",
  //         },
  //       ],
  //     };
  //     mockContacts.push(contact);
  //   }
  //   props.setContacts(mockContacts);
  //   ws.on("connect", () => {});
  //   ws.on("disconnect", () => {});
  // }, []);

  useEffect(() => {
    let contact = props.contacts.filter(
      (contact) => contact.contactNumber === currentChat?.contactNumber
    );

    if (contact.length > 0) {
      setCurrentChat(contact[0]);
    }
  }, [props.contacts]);

  function onContactClick(e: React.MouseEvent) {
    e.preventDefault();

    activeAnchor.current?.classList.toggle("active");
    e.currentTarget.classList.toggle("active");
    activeAnchor.current = e.currentTarget;

    let contact = props.contacts.filter(
      (contact) => contact.contactNumber === e.currentTarget.innerHTML
    );

    if (contact.length > 0) {
      setCurrentChat(contact[0]);
    }
  }

  function onAddContact(e: any) {
    const phoneToAdd = addPhoneInput.current?.value;
    let filtered = props.contacts.filter(
      (contact) => contact.contactNumber === phoneToAdd
    );
    if (filtered.length === 0)
      props.setContacts([
        ...props.contacts,
        { contactNumber: phoneToAdd, messages: [] },
      ]);
  }

  return (
    <div className="container mx-auto my-auto">
      <div className="row rounded-lg overflow-hidden shadow">
        <div className="col-5 px-0">
          <div className="bg-gray px-2 py-2 bg-light">
            <div className="d-flex justify-content-between">
              <p className="h5 mb-0 py-1">Contacts</p>
              <div className="d-flex h-25">
                <input
                  type="text"
                  ref={addPhoneInput}
                  // onChange={(e) => setPhoneToAdd(e.target.value)}
                  className="form-control h-25"
                  placeholder="add phone number"
                />
                <button
                  type="button"
                  className="btn btn-primary h-25"
                  onClick={onAddContact}
                >
                  add
                </button>
              </div>
            </div>
          </div>
          <hr className="hr m-0" />
          <div className="list-group rounded-2">
            <>
              {props.contacts.map((contact, i) => (
                <p
                  key={i}
                  className="mb-0 list-group-item py-3 list-group-item-action rounded-0"
                  onClick={onContactClick}
                >
                  {contact.contactNumber}
                </p>
              ))}
            </>
          </div>
        </div>
        <div className="col-7 px-0">
          {currentChat ? (
            <ChatBox contact={currentChat} setContact={setCurrentChat} />
          ) : (
            <div style={{ height: "471px" }}></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
