// @flow
import { Component } from 'react';
import invariant from 'invariant';
import rafScheduler from 'raf-schd';
import memoizeOne from 'memoize-one';
import getWindowScrollPosition from '../get-window-scroll-position';
import { getDroppableDimension } from '../../state/dimension';
import getClosestScrollable from '../get-closest-scrollable';
// eslint-disable-next-line no-duplicate-imports
import type { Margin } from '../../state/dimension';
import type { DroppableDimension, Position, HTMLElement } from '../../types';
import type { Props } from './droppable-dimension-publisher-types';

const origin: Position = { x: 0, y: 0 };

export default class DroppableDimensionPublisher extends Component {
  /* eslint-disable react/sort-comp */
  props: Props;

  closestScrollable: HTMLElement = null;

  getScrollOffset = (): Position => {
    return origin;
  }

  getDimension = (): DroppableDimension => {
    const { droppableId, targetRef } = this.props;
    const style = window.getComputedStyle(targetRef);
    const margin: Margin = {
      top: parseInt(style.marginTop, 10),
      right: parseInt(style.marginRight, 10),
      bottom: parseInt(style.marginBottom, 10),
      left: parseInt(style.marginLeft, 10),
    };
    const dimension: DroppableDimension = getDroppableDimension({
      id: droppableId,
      clientRect: targetRef.getBoundingClientRect(),
      margin,
      windowScroll: getWindowScrollPosition(),
      scroll: this.getScrollOffset(),
    });
    return dimension;
  }



  // TODO: componentDidUpdate?
  componentWillReceiveProps(nextProps: Props) {
    if (!nextProps.shouldPublish) {
      return;
    }
    this.props.publish(this.getDimension());
  }

  render() {
    return this.props.children;
  }
}
