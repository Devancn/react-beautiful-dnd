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
  

const getStyle = (point): Style => {
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


  render() {
    return this.props.children(
      getStyle(this.props.destination)
    )
  }
}
