import { defaultSnapOrigin } from '../config';

/**
 * Get the installed snaps in MetaMask.
 *
 * @param provider - The MetaMask inpage provider.
 * @returns The snaps installed in MetaMask.
 */
export const getSnaps = async (provider) =>
  await (provider ?? window.ethereum).request({
    method: 'wallet_getSnaps',
  });

/**
 * Connect a snap to MetaMask.
 *
 * @param snapId - The ID of the snap.
 * @param params - The params to pass with the snap to connect.
 */
export const connectSnap = async (snapId, params) => {
  if (!snapId || typeof snapId !== 'string') {
    throw new Error('connectSnap: snapId must be a non-empty string');
  }
  await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: params ?? {},
    },
  });
};

/**
 * Get the snap from MetaMask.
 *
 * @param version - The version of the snap to install (optional).
 * @returns The snap object returned by the extension.
 */
export const getSnap = async (version) => {
  try {
    const snaps = await getSnaps();

    return Object.values(snaps).find(
      (snap) =>
        snap.id === defaultSnapOrigin && (!version || snap.version === version)
    );
  } catch (error) {
    return undefined;
  }
};

export const isLocalSnap = (snapId) => snapId.startsWith('local:');
