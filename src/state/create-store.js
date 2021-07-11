// @flow
/* eslint-disable no-underscore-dangle */
import { applyMiddleware, createStore, compose } from 'redux';
import reducer from './reducer';
import lift from './middleware/lift';
import style from './middleware/style';
import drop from './middleware/drop/drop-middleware';
import scrollListener from './middleware/scroll-listener';
import responders from './middleware/responders/responders-middleware';
import dropAnimationFinish from './middleware/drop/drop-animation-finish-middleware';
import dropAnimationFlushOnScroll from './middleware/drop/drop-animation-flush-on-scroll-middleware';
import dimensionMarshalStopper from './middleware/dimension-marshal-stopper';
import focus from './middleware/focus';
import autoScroll from './middleware/auto-scroll';
import pendingDrop from './middleware/pending-drop';
import type { DimensionMarshal } from './dimension-marshal/dimension-marshal-types';
import type { FocusMarshal } from '../view/use-focus-marshal/focus-marshal-types';
import type { StyleMarshal } from '../view/use-style-marshal/style-marshal-types';
import type { AutoScroller } from './auto-scroller/auto-scroller-types';
import type { Responders, Announce } from '../types';
import type { Store } from './store-types';

// We are checking if window is available before using it.
// This is needed for universal apps that render the component server side.
// Details: https://github.com/zalmoxisus/redux-devtools-extension#12-advanced-store-setup
const composeEnhancers =
  process.env.NODE_ENV !== 'production' &&
  typeof window !== 'undefined' &&
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
        name: 'react-beautiful-dnd',
      })
    : compose;

type Args = {|
  dimensionMarshal: DimensionMarshal,
  focusMarshal: FocusMarshal,
  styleMarshal: StyleMarshal,
  getResponders: () => Responders,
  announce: Announce,
  autoScroller: AutoScroller,
|};

export default ({
  dimensionMarshal,
  focusMarshal,
  styleMarshal,
  getResponders,
  announce,
  autoScroller,
}: Args): Store => {
  return createStore(
    reducer,
    composeEnhancers(
      applyMiddleware(
        style(styleMarshal),
        dimensionMarshalStopper(dimensionMarshal),
        // Fire application responders in response to drag changes
        lift(dimensionMarshal),
        drop,
        // When a drop animation finishes - fire a drop complete
        dropAnimationFinish,
        dropAnimationFlushOnScroll,
        pendingDrop,
        autoScroll(autoScroller),
        scrollListener,
        focus(focusMarshal),
        // Fire responders for consumers (after update to store)
        responders(getResponders, announce),
      ),
    ),
  );
};
