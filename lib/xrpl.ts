import { Client } from 'xrpl';

export const XRPL_WSS = 'wss://s.altnet.rippletest.net:51233/';
const RIPPLE_EPOCH_OFFSET = 946684800;

export const toRippleTime = (unixSeconds: number) => unixSeconds - RIPPLE_EPOCH_OFFSET;

export const minutesFromNowRipple = (minutes: number) => {
  const unixSeconds = Math.floor(Date.now() / 1000) + minutes * 60;
  return toRippleTime(unixSeconds);
};

export const getClient = (() => {
  let client: Client | null = null;
  return async () => {
    if (!client) {
      client = new Client(XRPL_WSS);
    }
    if (!client.isConnected()) {
      await client.connect();
    }
    return client;
  };
})();
