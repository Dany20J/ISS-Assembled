# Details

Date : 2023-01-05 12:40:35

Directory /Users/dany88gwabry/Documents/nodeJS/react-chatapp_p5_v2/src

Total : 54 files,  1840 codes, 116 comments, 275 blanks, all 2231 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [src/App.css](/src/App.css) | CSS | 33 | 0 | 6 | 39 |
| [src/App.tsx](/src/App.tsx) | TypeScript React | 83 | 0 | 10 | 93 |
| [src/Components/ChatPage/ChatBox.tsx](/src/Components/ChatPage/ChatBox.tsx) | TypeScript React | 61 | 8 | 10 | 79 |
| [src/Components/ChatPage/ChatMessage.tsx](/src/Components/ChatPage/ChatMessage.tsx) | TypeScript React | 23 | 1 | 4 | 28 |
| [src/Components/empty.tsx](/src/Components/empty.tsx) | TypeScript React | 4 | 0 | 2 | 6 |
| [src/Contexts/mediator.ts](/src/Contexts/mediator.ts) | TypeScript | 5 | 0 | 1 | 6 |
| [src/Contexts/socket.ts](/src/Contexts/socket.ts) | TypeScript | 1 | 6 | 3 | 10 |
| [src/Contexts/userContext.ts](/src/Contexts/userContext.ts) | TypeScript | 2 | 0 | 1 | 3 |
| [src/Interfaces/Message.ts](/src/Interfaces/Message.ts) | TypeScript | 4 | 0 | 1 | 5 |
| [src/Interfaces/contacts.ts](/src/Interfaces/contacts.ts) | TypeScript | 5 | 1 | 2 | 8 |
| [src/Services/mediator.ts](/src/Services/mediator.ts) | TypeScript | 5 | 0 | 1 | 6 |
| [src/Services/socket.ts](/src/Services/socket.ts) | TypeScript | 2 | 0 | 1 | 3 |
| [src/controllers/auth.ts](/src/controllers/auth.ts) | TypeScript | 30 | 0 | 7 | 37 |
| [src/controllers/endpoints.ts](/src/controllers/endpoints.ts) | TypeScript | 3 | 0 | 1 | 4 |
| [src/index.css](/src/index.css) | CSS | 12 | 0 | 2 | 14 |
| [src/index.tsx](/src/index.tsx) | TypeScript React | 15 | 4 | 3 | 22 |
| [src/mediator/auth/authentication_repository.ts](/src/mediator/auth/authentication_repository.ts) | TypeScript | 45 | 0 | 3 | 48 |
| [src/mediator/auth/authenticator.ts](/src/mediator/auth/authenticator.ts) | TypeScript | 285 | 6 | 67 | 358 |
| [src/mediator/client.ts](/src/mediator/client.ts) | TypeScript | 36 | 0 | 7 | 43 |
| [src/mediator/json_validator.ts](/src/mediator/json_validator.ts) | TypeScript | 17 | 0 | 3 | 20 |
| [src/mediator/main.ts](/src/mediator/main.ts) | TypeScript | 1 | 21 | 2 | 24 |
| [src/mediator/queue.ts](/src/mediator/queue.ts) | TypeScript | 22 | 0 | 3 | 25 |
| [src/mediator/shared_functions/shared_functions.ts](/src/mediator/shared_functions/shared_functions.ts) | TypeScript | 63 | 0 | 12 | 75 |
| [src/mediator/shared_types/certificate.ts](/src/mediator/shared_types/certificate.ts) | TypeScript | 9 | 0 | 0 | 9 |
| [src/mediator/shared_types/chat_message_state.ts](/src/mediator/shared_types/chat_message_state.ts) | TypeScript | 16 | 0 | 2 | 18 |
| [src/mediator/shared_types/external_replies/get_certificate_reply.ts](/src/mediator/shared_types/external_replies/get_certificate_reply.ts) | TypeScript | 5 | 0 | 1 | 6 |
| [src/mediator/shared_types/external_replies/get_chats_history_reply.ts](/src/mediator/shared_types/external_replies/get_chats_history_reply.ts) | TypeScript | 19 | 0 | 4 | 23 |
| [src/mediator/shared_types/external_replies/get_messages_history_reply.ts](/src/mediator/shared_types/external_replies/get_messages_history_reply.ts) | TypeScript | 13 | 0 | 2 | 15 |
| [src/mediator/shared_types/external_replies/get_public_key_reply.ts](/src/mediator/shared_types/external_replies/get_public_key_reply.ts) | TypeScript | 5 | 0 | 2 | 7 |
| [src/mediator/shared_types/external_replies/reply.ts](/src/mediator/shared_types/external_replies/reply.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [src/mediator/shared_types/external_replies/set_session_key_reply.ts](/src/mediator/shared_types/external_replies/set_session_key_reply.ts) | TypeScript | 2 | 0 | 1 | 3 |
| [src/mediator/shared_types/external_replies/sign_in_reply.ts](/src/mediator/shared_types/external_replies/sign_in_reply.ts) | TypeScript | 3 | 0 | 1 | 4 |
| [src/mediator/shared_types/external_replies/sign_up_reply.ts](/src/mediator/shared_types/external_replies/sign_up_reply.ts) | TypeScript | 3 | 0 | 1 | 4 |
| [src/mediator/shared_types/internal_requests/send_message_request.ts](/src/mediator/shared_types/internal_requests/send_message_request.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [src/mediator/shared_types/internal_requests/sign_in_request.ts](/src/mediator/shared_types/internal_requests/sign_in_request.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [src/mediator/shared_types/internal_requests/sign_out_request.ts](/src/mediator/shared_types/internal_requests/sign_out_request.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [src/mediator/shared_types/internal_requests/sign_up_request.ts](/src/mediator/shared_types/internal_requests/sign_up_request.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [src/mediator/shared_types/message_event.ts](/src/mediator/shared_types/message_event.ts) | TypeScript | 8 | 0 | 0 | 8 |
| [src/mediator/shared_types/socket_message.ts](/src/mediator/shared_types/socket_message.ts) | TypeScript | 3 | 0 | 0 | 3 |
| [src/mediator/state/chat_prep_state.ts](/src/mediator/state/chat_prep_state.ts) | TypeScript | 135 | 0 | 5 | 140 |
| [src/mediator/state/chat_state.ts](/src/mediator/state/chat_state.ts) | TypeScript | 158 | 17 | 11 | 186 |
| [src/mediator/state/starting_state.ts](/src/mediator/state/starting_state.ts) | TypeScript | 87 | 3 | 15 | 105 |
| [src/mediator/state/state.ts](/src/mediator/state/state.ts) | TypeScript | 6 | 0 | 1 | 7 |
| [src/mediator/state_gui_mediator/state_gui_mediator.ts](/src/mediator/state_gui_mediator/state_gui_mediator.ts) | TypeScript | 187 | 2 | 18 | 207 |
| [src/mediator/websocket/consumed_msgs.ts](/src/mediator/websocket/consumed_msgs.ts) | TypeScript | 20 | 0 | 2 | 22 |
| [src/mediator/websocket/msg_buffer.ts](/src/mediator/websocket/msg_buffer.ts) | TypeScript | 13 | 0 | 6 | 19 |
| [src/mediator/websocket/msg_model.ts](/src/mediator/websocket/msg_model.ts) | TypeScript | 4 | 0 | 1 | 5 |
| [src/mediator/websocket/websocket_connection.ts](/src/mediator/websocket/websocket_connection.ts) | TypeScript | 82 | 3 | 7 | 92 |
| [src/pages/AuthPage.tsx](/src/pages/AuthPage.tsx) | TypeScript React | 41 | 0 | 4 | 45 |
| [src/pages/ChatPage.css](/src/pages/ChatPage.css) | CSS | 9 | 1 | 4 | 14 |
| [src/pages/ChatPage.tsx](/src/pages/ChatPage.tsx) | TypeScript React | 95 | 42 | 14 | 151 |
| [src/pages/LoginPage.tsx](/src/pages/LoginPage.tsx) | TypeScript React | 62 | 0 | 9 | 71 |
| [src/pages/SignUpPage.tsx](/src/pages/SignUpPage.tsx) | TypeScript React | 81 | 0 | 11 | 92 |
| [src/react-app-env.d.ts](/src/react-app-env.d.ts) | TypeScript | 0 | 1 | 1 | 2 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)