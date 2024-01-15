import { StateGUIMediator } from "../state_gui_mediator/state_gui_mediator";

export abstract class State {
    constructor(protected med: StateGUIMediator) {}
    public abstract applyExternalEvent(event: any): void
    public abstract notifyAsSet(event: any): void
}