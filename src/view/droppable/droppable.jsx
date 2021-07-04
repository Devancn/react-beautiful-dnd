import React, { Component, PropTypes } from 'react';
import type { Props, Provided, StateSnapshot, DefaultProps } from './droppable-types';
import type { DroppableId, HTMLElement } from '../../types';
import DroppableDimensionPublisher from '../droppable-dimension-publisher/';
import { droppableIdKey } from '../context-keys';

type State = {|
  ref: ?HTMLElement,
|}

type Context = {|
  [droppableIdKey]: DroppableId
|}

export default class Droppable extends Component {
  /* eslint-disable react/sort-comp */
  props: Props
  state: State

  state: State = {
    ref: null,
  }
  static defaultProps: DefaultProps = {
    type: 'DEFAULT',
    isDropDisabled: false,
  }

  static childContextTypes = {
    [droppableIdKey]: PropTypes.string.isRequired,
  }

  getChildContext(): Context {
    const value: Context = {
      [droppableIdKey]: this.props.droppableId,
    };
    return value;
  }
  
  setRef = (ref: ?HTMLElement) => {
    this.setState({
      ref,
    });
  }

  render() {
    const provided: Provided = {
      innerRef: this.setRef,
    };

    return (
      <DroppableDimensionPublisher
        droppableId={this.props.droppableId}
        type={this.props.type}
        targetRef={this.state.ref}
      >
        {this.props.children(provided, false)}
      </DroppableDimensionPublisher>
    );
  }
}
