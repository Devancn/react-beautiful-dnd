// @flow
import type {
  DraggableId,
  DroppableId,
  DropResult,
  TypeId,
  DraggableDimension,
  DroppableDimension,
  InitialDragLocation,
  Position,
  Dispatch,
  State,
} from '../types';

export const requestDimensions = (type: TypeId): RequestDimensionsAction => ({
  type: 'REQUEST_DIMENSIONS',
  payload: type,
});


const beginLift = (): BeginLiftAction => ({
  type: 'BEGIN_LIFT',
});


const completeLift = (id: DraggableId,
  type: TypeId,
  client: InitialDragLocation,
  page: InitialDragLocation,
  windowScroll: Position,
): CompleteLiftAction => ({
  type: 'COMPLETE_LIFT',
  payload: {
    id,
    type,
    client,
    page,
    windowScroll,
  },
});

export const publishDraggableDimension =
  (dimension: DraggableDimension): PublishDraggableDimensionAction => ({
    type: 'PUBLISH_DRAGGABLE_DIMENSION',
    payload: dimension,
  });

export const publishDroppableDimension =
  (dimension: DroppableDimension): PublishDroppableDimensionAction => ({
    type: 'PUBLISH_DROPPABLE_DIMENSION',
    payload: dimension,
  });

export const move = (id: DraggableId,
  client: Position,
  page: Position,
  windowScroll: Position): MoveAction => ({
    type: 'MOVE',
    payload: {
      id,
      client,
      page,
      windowScroll,
    },
  });

export const completeDrop = (result: DropResult): DropCompleteAction => ({
  type: 'DROP_COMPLETE',
  payload: result,
});

export const drop = (id: DraggableId) =>
  (dispatch: Dispatch, getState: () => State): void => {
    const state: State = getState();
    const { impact, initial, current } = state.drag;
    const result: DropResult = {
      draggableId: current.id,
      source: initial.source,
      destination: impact.destination,
    };
    dispatch(completeDrop(result));
  };

// using redux-thunk
export const lift = (id: DraggableId,
  type: TypeId,
  client: InitialDragLocation,
  page: InitialDragLocation,
  windowScroll: Position,
) => (dispatch: Dispatch, getState: Function) => {
    dispatch(requestDimensions(type));
    setTimeout(() => {
      dispatch(completeLift(id, type, client, page, windowScroll));
    });
  // });
};

