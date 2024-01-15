import { createContext } from "react";
import { StateGUIMediator } from "../mediator/state_gui_mediator/state_gui_mediator";
export const MediatorContext = createContext<StateGUIMediator | undefined>(
  undefined
);
