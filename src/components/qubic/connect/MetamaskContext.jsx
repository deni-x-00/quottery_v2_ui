import { createContext, useEffect, useReducer } from 'react';

import { detectSnaps, getSnap, isFlask } from './utils';

export const MetamaskState = {
  snapsDetected: false,
  isFlask: false,
  installedSnap: undefined,
  error: undefined,
};

const initialState = {
  snapsDetected: false,
  isFlask: false,
};

export const MetaMaskContext = createContext([
  initialState,
  () => {
    /* no-op */
  },
]);
export const MetamaskActions = Object.freeze({
  SetInstalled: 'SetInstalled',
  SetSnapsDetected: 'SetSnapsDetected',
  SetError: 'SetError',
  SetIsFlask: 'SetIsFlask',
});

const reducer = (state, action) => {
  switch (action.type) {
    case MetamaskActions.SetInstalled:
      return {
        ...state,
        installedSnap: action.payload,
      };

    case MetamaskActions.SetSnapsDetected:
      return {
        ...state,
        snapsDetected: action.payload,
      };
    case MetamaskActions.SetIsFlask:
      return {
        ...state,
        isFlask: action.payload,
      };
    case MetamaskActions.SetError:
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

/**
 * MetaMask context provider to handle MetaMask and snap status.
 *
 * @param props - React Props.
 * @param props.children - React component to be wrapped by the Provider.
 * @returns JSX.
 */
export const MetaMaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Find MetaMask Provider and search for Snaps
  // Also checks if MetaMask version is Flask
  useEffect(() => {
    try {
      const setSnapsCompatibility = async () => {
        dispatch({
          type: MetamaskActions.SetSnapsDetected,
          payload: await detectSnaps(),
        });
      };

      setSnapsCompatibility().catch((error) => {
        console.error('Error during initialization:', error);
      });
    } catch (error) {
      console.error('Error in useEffect:', error);
    }
  }, []);

  // Set installed snaps
  useEffect(() => {
    /**
     * Detect if a snap is installed and set it in the state.
     */
    async function detectSnapInstalled() {
      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: await getSnap(),
      });
    }

    const checkIfFlask = async () => {
      dispatch({
        type: MetamaskActions.SetIsFlask,
        payload: await isFlask(),
      });
    };

    if (state.snapsDetected) {
      detectSnapInstalled().catch(console.error);
      checkIfFlask().catch(console.error);
    }
  }, [state.snapsDetected]);

  useEffect(() => {
    let timeoutId: number;

    if (state.error) {
      timeoutId = window.setTimeout(() => {
        dispatch({
          type: MetamaskActions.SetError,
          payload: undefined,
        });
      }, 10000);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [state.error]);

  // TODO check this position
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  return (
    <MetaMaskContext.Provider value={[state, dispatch]}>
      {children}
    </MetaMaskContext.Provider>
  );
};
