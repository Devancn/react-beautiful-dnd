// @flow
import memoizeOne from "memoize-one";
import type {
  TypeId,
  Action,
  State,
  DraggableDimension,
  DroppableDimension,
  DroppableId,
  DimensionState,
  DragImpact,
  DragState,
  DropResult,
  CurrentDrag,
  InitialDrag,
  PendingDrop,
  Phase,
  DraggableLocation,
  CurrentDragLocation,
  Position,
  WithinDroppable,
} from "../types";
import { add, subtract, negate } from "./position";
import getDragImpact from "./get-drag-impact";
import getDiffToJumpToNextIndex from "./get-diff-to-jump-to-next-index";
import getDroppableOver from "./get-droppable-over";

const noDimensions: DimensionState = {
  request: null,
  draggable: {},
  droppable: {},
};

const origin: Position = { x: 0, y: 0 };

const clean = memoizeOne((phase: ?Phase): State => {
  const state: State = {
    // flow was not good with having a default arg on an optional type
    phase: phase || "IDLE",
    drag: null,
    drop: null,
    dimension: noDimensions,
  };

  return state;
});

type MoveArgs = {|
  state: State,
  clientSelection: Position,
  pageSelection: Position,
  shouldAnimate?: boolean,
  windowScroll?: Position,
|};

const move = ({
  state,
  clientSelection,
  pageSelection,
  shouldAnimate = false,
  windowScroll,
}: MoveArgs): State => {
  const previous: CurrentDrag = state.drag.current;
  const initial: InitialDrag = state.drag.initial;

  const droppable: DroppableDimension =
    state.dimension.droppable[initial.source.droppableId];

  const client: CurrentDragLocation = (() => {
    const offset: Position = subtract(
      clientSelection,
      initial.client.selection
    );
    const center: Position = add(offset, initial.client.center);

    const result: CurrentDragLocation = {
      selection: clientSelection,
      offset,
      center,
    };
    return result;
  })();
  const page: CurrentDragLocation = (() => {
    const offset: Position = subtract(pageSelection, initial.page.selection);
    const center: Position = add(offset, initial.page.center);

    const result: CurrentDragLocation = {
      selection: pageSelection,
      offset,
      center,
    };
    return result;
  })();
  const scrollDiff: Position = subtract(
    droppable.scroll.initial,
    droppable.scroll.current
  );
  const withinDroppable: WithinDroppable = {
    center: add(page.center, negate(scrollDiff)),
  };
  const current: CurrentDrag = {
    id: previous.id,
    type: previous.type,
    client,
    page
  };

  const impact: DragImpact = getDragImpact({
    page: page.selection,
    withinDroppable,
    draggableId: current.id,
    draggables: state.dimension.draggable,
    droppables: state.dimension.droppable,
  });
  
  const drag: DragState = {
    initial,
    impact,
    current,
  };
  return {
    ...state,
    drag,
  };
};

export default (state: State = clean("IDLE"), action: Action): State => {
  if (action.type === "BEGIN_LIFT") {
    return clean("COLLECTING_DIMENSIONS");
  }

  if (action.type === "REQUEST_DIMENSIONS") {
    const typeId: TypeId = action.payload;
    return {
      phase: "COLLECTING_DIMENSIONS",
      drag: null,
      drop: null,
      dimension: {
        request: typeId,
        draggable: {},
        droppable: {},
      },
    };
  }

  if (action.type === "PUBLISH_DRAGGABLE_DIMENSION") {
    const dimension: DraggableDimension = action.payload;

    return {
      ...state,
      dimension: {
        request: state.dimension.request,
        droppable: state.dimension.droppable,
        draggable: {
          ...state.dimension.draggable,
          [dimension.id]: dimension,
        },
      },
    };
  }

  if (action.type === "PUBLISH_DROPPABLE_DIMENSION") {
    const dimension: DroppableDimension = action.payload;
    return {
      ...state,
      dimension: {
        request: state.dimension.request,
        draggable: state.dimension.draggable,
        droppable: {
          ...state.dimension.droppable,
          [dimension.id]: dimension,
        },
      },
    };
  }

  if (action.type === "COMPLETE_LIFT") {
    const { id, type, client, page, windowScroll } = action.payload;
    // no scroll diff yet so withinDroppable is just the center position
    const withinDroppable: WithinDroppable = {
      center: page.center,
    };
    const impact: DragImpact = getDragImpact({
      page: page.selection,
      withinDroppable,
      draggableId: id,
      draggables: state.dimension.draggable,
      droppables: state.dimension.droppable,
    });
    const source: ?DraggableLocation = impact.destination;
    const initial: InitialDrag = {
      source,
      client,
      page,
      windowScroll,
      withinDroppable,
    };
    const current: CurrentDrag = {
      id,
      type,
      client: {
        selection: client.selection,
        center: client.center,
        offset: origin,
      },
      page: {
        selection: page.selection,
        center: page.center,
        offset: origin,
      },
      withinDroppable,
      windowScroll,
      shouldAnimate: false,
    };
    return {
      ...state,
      phase: "DRAGGING",
      drag: {
        initial,
        current,
        impact,
      },
    };
  }

  if (action.type === "UPDATE_DROPPABLE_DIMENSION_SCROLL") {

    const { id, offset } = action.payload;

    const target: ?DroppableDimension = state.dimension.droppable[id];


    // TODO: do not break an existing dimension.
    // Rather, have a different structure to store the scroll
    // $ExpectError - flow does not like spread
    const dimension: DroppableDimension = {
      ...target,
      scroll: {
        initial: target.scroll.initial,
        current: offset,
      },
    };

    const withUpdatedDimension: State = {
      ...state,
      dimension: {
        request: state.dimension.request,
        draggable: state.dimension.draggable,
        droppable: {
          ...state.dimension.droppable,
          [id]: dimension,
        },
      },
    };

    const { client, page } = state.drag.current;

    return move({
      state: withUpdatedDimension,
      clientSelection: client.selection,
      pageSelection: page.selection,
    });
  }

  if (action.type === "MOVE") {
    const { client, page, windowScroll } = action.payload;
    return move({
      state,
      clientSelection: client,
      pageSelection: page,
      windowScroll,
    });
  }

  if (action.type === "DROP_COMPLETE") {
    const result: DropResult = action.payload;

    return {
      phase: "DROP_COMPLETE",
      drag: null,
      drop: {
        pending: null,
        result,
      },
      dimension: noDimensions,
    };
  }


  return state;
};
