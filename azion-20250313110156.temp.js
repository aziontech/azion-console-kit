import { mountSPA } from 'azion/utils';
/* eslint-disable */
addEventListener('fetch', (event) => {
  event.respondWith((async function() {
        

/**
 * Handles the 'fetch' event.
 * @param {import('azion/types').FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */

try {
  const myApp = await mountSPA(event.request.url);
  return myApp;
} catch (e) {
  return new Response('Not Found', {
    status: 404
  });
}
      })());
});
