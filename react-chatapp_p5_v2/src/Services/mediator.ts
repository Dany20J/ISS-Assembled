import {Client} from "../mediator/client";
import {StateGUIMediator} from "../mediator/state_gui_mediator/state_gui_mediator";

let client = new Client();
export let med = new StateGUIMediator(client);
client.connect();