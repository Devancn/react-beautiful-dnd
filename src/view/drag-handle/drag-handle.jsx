// @flow
import { Component } from 'react';
import invariant from 'invariant';
import memoizeOne from 'memoize-one';
import rafScheduler from 'raf-schd';
// Using keyCode's for consistent event pattern matching between
// React synthetic events as well as raw browser events.
import * as keyCodes from '../key-codes';
import type { Position } from '../../types';
import type { Props, DragTypes, Provided } from './drag-handle-types';

const noop = (): void => { };
const getFalse: () => boolean = () => false;

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
const primaryButton = 0;

// The amount of pixels that need to move before we consider the movement
// a drag rather than a click.
export const sloppyClickThreshold: number = 5;


export default class DragHandle extends Component {
  /* eslint-disable react/sort-comp */

  props: Props
  state: State

  state: State = {
    pending: null,
  };


  memoizedMove = memoizeOne((x: number, y: number) => {
    const point: Position = { x, y };
    this.props.callbacks.onMove(point);
  });

  // scheduled functions
  scheduleMove =(point: Position) => {
    this.memoizedMove(point.x, point.y)
  };


  onWindowMouseMove = (event: MouseEvent) => {
    const {pending } = this.state;
    const { clientX, clientY } = event;
    const point: Position = {
      x: clientX,
      y: clientY,
    };
    if (!pending) {
      this.scheduleMove(point);
      return;
    }

    this.setState( {
      pending: null,
    }, () => this.props.callbacks.onLift(point));
  };

  onWindowMouseUp = () => {
    this.stopDragging(() => this.props.callbacks.onDrop());
  };


  onMouseDown = (event: MouseEvent) => {
    const {clientX, clientY } = event;

    event.stopPropagation();
    event.preventDefault();

    const point: Position = {
      x: clientX,
      y: clientY,
    };

    this.startPendingMouseDrag(point);
  };


  startPendingMouseDrag = (point: Position) => {
    // need to bind the window events 
    this.bindWindowEvents();

    const state: State = {
      pending: point,
    };
    this.setState(state);
  }

  stopPendingMouseDrag = (done?: () => void = noop) => {


    this.unbindWindowEvents();
    this.setState({
      pending: null,
    }, done);
  }

  stopDragging = (done?: () => void = noop) => {

    this.unbindWindowEvents();

    const state: State = {
      pending: null,
    };
    this.setState(state, done);
  }

  unbindWindowEvents = () => {
    window.removeEventListener('mousemove', this.onWindowMouseMove);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
  }

  bindWindowEvents = () => {
    window.addEventListener('mousemove', this.onWindowMouseMove);
    window.addEventListener('mouseup', this.onWindowMouseUp);
  }


  render() {
    const { children } = this.props;
    return children({
      onMouseDown: this.onMouseDown,
    });
  }
}
