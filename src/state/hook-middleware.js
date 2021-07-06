// @flow
import memoizeOne from "memoize-one";
import type { Action, Store, State, Hooks, DropResult } from "../types";

const getFireHooks = (hooks: Hooks) =>
  memoizeOne((current: State, previous: State): void => {
    const { onDragStart, onDragEnd } = hooks;

    const currentPhase = current.phase;
    const previousPhase = previous.phase;
    // Drag end
    if (currentPhase === "DROP_COMPLETE" && previousPhase !== "DROP_COMPLETE") {
      onDragEnd(current.drop.result);
      return;
    }

    // Drag cancelled while dragging
    // if (currentPhase === "IDLE" && previousPhase === "DRAGGING") {
    //   if (!previous.drag) {
    //     console.error(
    //       "cannot fire onDragEnd for cancel because cannot find previous drag"
    //     );
    //     return;
    //   }
    //   const result: DropResult = {
    //     draggableId: previous.drag.current.id,
    //     source: previous.drag.initial.source,
    //     destination: null,
    //   };
    //   onDragEnd(result);
    // }

    // Drag cancelled during a drop animation. Not super sure how this can even happen.
    // This is being really safe
    // if (currentPhase === "IDLE" && previousPhase === "DROP_ANIMATING") {
    //   if (!previous.drop || !previous.drop.pending) {
    //     console.error(
    //       "cannot fire onDragEnd for cancel because cannot find previous pending drop"
    //     );
    //     return;
    //   }

    //   const result: DropResult = {
    //     draggableId: previous.drop.pending.result.draggableId,
    //     source: previous.drop.pending.result.source,
    //     destination: null,
    //   };
    //   onDragEnd(result);
    // }
  });

export default (hooks: Hooks) => {
  const fireHooks = getFireHooks(hooks);
  return (store: Store) =>
    (next: (Action) => mixed) =>
    (action: Action): mixed => {
      const previous: State = store.getState();

      const result: mixed = next(action);

      const current: State = store.getState();
      fireHooks(current, previous);
    };
};
