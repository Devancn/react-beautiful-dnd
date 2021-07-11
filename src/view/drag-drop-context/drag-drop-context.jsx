// @flow
import React, { type Node } from 'react';
import type { Responders, ContextId, Sensor } from '../../types';
import ErrorBoundary from './error-boundary';
import preset from '../../screen-reader-message-preset';
import App from './app';
import useUniqueContextId, {
  reset as resetContextId,
} from './use-unique-context-id';
import { reset as resetUniqueIds } from '../use-unique-id';


// Reset any context that gets persisted across server side renders
export function resetServerContext() {
  resetContextId();
  resetUniqueIds();
}

export default function DragDropContext(props: Props) {
  const contextId: ContextId = useUniqueContextId();
  // We need the error boundary to be on the outside of App
  // so that it can catch any errors caused by App

  return (
    <ErrorBoundary>
      {(setCallbacks) => (
        <App
          contextId={contextId}
          setCallbacks={setCallbacks}
          onDragEnd={props.onDragEnd}
        >
          {props.children}
        </App>
      )}
    </ErrorBoundary>
  );
}
