
import { createClient, OAuthStrategy } from '@wix/sdk';
import { members } from '@wix/members';
import Cookies from 'js-cookie';

// Use the CLIENT_ID provided by the user
export const WIX_CLIENT_ID = "66d2adcb-75b9-470e-86cf-adb112f5cea7";
const WIX_SESSION_COOKIE_NAME = "wixSession";

// Function to safely parse JSON from cookie
const getTokensFromCookie = () => {
  const tokensStr = Cookies.get(WIX_SESSION_COOKIE_NAME);
  if (tokensStr) {
    try {
      return JSON.parse(tokensStr);
    } catch (error) {
      console.error("Failed to parse Wix session tokens from cookie:", error);
      Cookies.remove(WIX_SESSION_COOKIE_NAME); // Remove invalid cookie
      return null;
    }
  }
  return null;
};

export const myWixClient = createClient({
  modules: { members },
  auth: OAuthStrategy({
    clientId: WIX_CLIENT_ID,
    tokens: getTokensFromCookie(),
    // The SDK will manage token refresh and update cookies internally if configured correctly
    // and if the refresh token is available.
  }),
});

// Function to save tokens to cookie
export const saveTokensToCookie = (tokens: any) => {
  Cookies.set(WIX_SESSION_COOKIE_NAME, JSON.stringify(tokens), {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'lax', // Or 'strict' if appropriate
    // expires: can be set if tokens have an expiry, e.g., based on tokens.expiresIn
  });
};

// Function to remove tokens from cookie
export const removeTokensFromCookie = () => {
  Cookies.remove(WIX_SESSION_COOKIE_NAME);
};
