// @flow
import React, { Component } from 'react';
import { Motion, spring } from 'react-motion';
import { physics } from '../animation';
import type { Position } from '../../types';
import type { Props, DefaultProps, Style } from './moveable-types';

type PositionLike = {|
  x: any,
  y: any,
|};

const origin: Position = {
  x: 0,
  y: 0,
};

const noMovement: Style = {
  transform: null,
};

const isAtOrigin = (point: PositionLike): boolean => {
  const result = point.x === origin.x && point.y === origin.y;

 return result;
}
  

const getStyle = (isNotMoving: boolean, x: number, y: number): Style => {
  if (isNotMoving) {
    return noMovement;
  }

  const point: Position = { x, y };
  // not applying any transforms when not moving
  if (isAtOrigin(point)) {
    return noMovement;
  }
  const style: Style = {
    transform: `translate(${point.x}px, ${point.y}px)`,
  };
  return style;
};

export default class Movable extends Component {
  /* eslint-disable react/sort-comp */
  props: Props

  static defaultProps: DefaultProps = {
    destination: origin,
  }
  /* eslint-enable */

  onRest = () => {
    const { onMoveEnd } = this.props;
    if (!onMoveEnd) {
      return;
    }
    setTimeout(() => onMoveEnd());
  }

  getFinal = (): PositionLike => {
    const destination: Position = this.props.destination;
    const speed = this.props.speed;
    if (speed === 'INSTANT') {
      return destination;
    }
    const selected = speed === 'FAST' ? physics.fast : physics.standard;
    const x = spring(destination.x, selected);
    const y =  spring(destination.y, selected)
    return {
      x,
      y
    };
  }

  render() {
    const final = this.getFinal();
    const isNotMoving: boolean = isAtOrigin(final);
    // return this.props.children(
    //   getStyle(isNotMoving, final.x, final.y)
    // )
    return (
      <Motion defaultStyle={origin} style={final} onRest={this.onRest}>
        {(current: Position) => {
          return this.props.children(
            getStyle(isNotMoving, current.x, current.y)
          )}
        }
      </Motion>
    );
  }
}
