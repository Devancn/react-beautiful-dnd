// @flow
import React, { Component, PropTypes } from 'react';
import memoizeOne from 'memoize-one';
import invariant from 'invariant';
import type {
  Position,
  HTMLElement,
  DraggableDimension,
  InitialDragLocation,
} from '../../types';
import DraggableDimensionPublisher from '../draggable-dimension-publisher/';
import Moveable from '../moveable/';
import DragHandle from '../drag-handle';
import { css } from '../animation';
import getWindowScrollPosition from '../get-window-scroll-position';
// eslint-disable-next-line no-duplicate-imports
import type {
  Callbacks as DragHandleCallbacks,
  Provided as DragHandleProvided,
} from '../drag-handle/drag-handle-types';
import getCenterPosition from '../get-center-position';
import Placeholder from './placeholder';
import { droppableIdKey } from '../context-keys';
import { add } from '../../state/position';
import type {
  Props,
  Provided,
  StateSnapshot,
  DefaultProps,
  DraggingStyle,
  NotDraggingStyle,
  DraggableStyle,
} from './draggable-types';
import type { Speed, Style as MovementStyle } from '../moveable/moveable-types';

type State = {|
  ref: ?HTMLElement,
|}

export default class Draggable extends Component {
  /* eslint-disable react/sort-comp */
  props: Props
  state: State
  callbacks: DragHandleCallbacks

  state: State = {
    ref: null,
  }

  static defaultProps: DefaultProps = {
    isDragDisabled: false,
    type: 'DEFAULT',
  }

  // Need to declare contextTypes without flow
  // https://github.com/brigand/babel-plugin-flow-react-proptypes/issues/22
  static contextTypes = {
    [droppableIdKey]: PropTypes.string.isRequired,
  }
  /* eslint-enable */

  constructor(props: Props, context: mixed) {
    super(props, context);

    this.callbacks = {
      onLift: this.onLift,
      onMove: this.onMove,
      onDrop: this.onDrop,
    };
  }

  onLift = (point: Position) => {
    const { lift, draggableId, type } = this.props;
    const { ref } = this.state;
    const windowScroll: Position = getWindowScrollPosition();
    const client: InitialDragLocation = {
      selection: point,
      center: getCenterPosition(ref),
    };

    const page: InitialDragLocation = {
      selection: add(client.selection, windowScroll),
      center: add(client.center, windowScroll),
    };
    lift(draggableId, type, client, page, windowScroll);
  }
  onMove = (client: Position) => {
    const { draggableId, move } = this.props;
    const windowScroll: Position = getWindowScrollPosition();
    const page: Position = add(client, windowScroll);
    move(draggableId, client, page, windowScroll);
  }


  onDrop = () => {
    this.props.drop(this.props.draggableId);
  }


  // React calls ref callback twice for every render
  // https://github.com/facebook/react/pull/8333/files
  setRef = ((ref: ?HTMLElement) => {
    this.setState({
      ref,
    });
  })

  getPlaceholder() {
    const dimension: ?DraggableDimension = this.props.dimension;
    return (
      <Placeholder
        height={dimension.page.withMargin.height}
        width={dimension.page.withMargin.width}
      />
    );
  }

  getDraggingStyle = memoizeOne(
    (width: number,
      height: number,
      top: number,
      left: number,
      movementStyle: MovementStyle): DraggingStyle => {
      const style: DraggingStyle = {
        position: 'fixed',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        zIndex:10,
        width,
        height,
        top,
        left,
        transform: movementStyle.transform ? `${movementStyle.transform}` : null,
      };
      return style;
    }
  )

  getNotDraggingStyle = memoizeOne(
    (
      movementStyle: MovementStyle,
      isAnotherDragging: boolean,
    ): NotDraggingStyle => {
      const style: NotDraggingStyle = {
        transition: isAnotherDragging ? css.outOfTheWay : null,
        transform: movementStyle.transform,
        pointerEvents: isAnotherDragging ? 'none' : 'auto',
      };
      return style;
    }
  )

  getProvided = memoizeOne(
    (
      isDragging: boolean,
      isAnotherDragging: boolean,
      dimension: ?DraggableDimension,
      dragHandleProps: ?DragHandleProvided,
      movementStyle: MovementStyle,
    ): Provided => {
      const draggableStyle: DraggableStyle = (() => {
        if (!isDragging) {
          return this.getNotDraggingStyle(
            movementStyle,
            isAnotherDragging,
          );
        }
        const { width, height, top, left } = dimension.client.withoutMargin;
        return this.getDraggingStyle(width, height, top, left, movementStyle);
      })();

      const provided: Provided = {
        innerRef: this.setRef,
        placeholder: isDragging ? this.getPlaceholder() : null,
        dragHandleProps,
        draggableStyle,
      };
      return provided;
    }
  )

  render() {
    let {
      draggableId,
      type,
      offset,
      isDragging,
      isAnotherDragging,
      isDragDisabled,
      dimension,
      children,
    } = this.props;
    return (
      <DraggableDimensionPublisher
        draggableId={draggableId}
        droppableId={this.context[droppableIdKey]}
        type={type}
        targetRef={this.state.ref}
      >
        <Moveable
          destination={offset}
        >
          {(movementStyle: MovementStyle) => {
            return (
              <DragHandle
                isDragging={isDragging}
                isEnabled={!isDragDisabled}
                callbacks={this.callbacks}
                draggableRef={this.state.ref}
              >
                {(dragHandleProps: ?DragHandleProvided) =>
                  children(
                    this.getProvided(
                      isDragging,
                      isAnotherDragging,
                      dimension,
                      dragHandleProps,
                      movementStyle,
                    ),
                    {
                      isDragging
                    }
                  )
                }
              </DragHandle>
          )
          }}
        </Moveable>
      </DraggableDimensionPublisher>
    );
  }
}
