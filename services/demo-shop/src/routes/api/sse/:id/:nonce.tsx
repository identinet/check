import type { APIEvent } from "@solidjs/start/server";
/* import { getJson, getValkeyStore } from "~/lib/store_redis.js"; */
import { connections, store } from "~/lib/store.js";

/* function retry(delay: number) { */
/*   return new Promise((resolve) => { */
/*     setTimeout(resolve, delay); */
/*   }); */
/* } */

/**
 * Function submits a navigation request to the connected browser window via the existing SSE connection between client
 * and server, the final step in the authorization flow.
 */
export function GET(event: APIEvent) {
  console.debug("sse/ID/NONCE", event.params);
  const { id, nonce } = event.params;

  /* INFO: for use with Redis backend */
  /* const store = getValkeyStore(); */
  /* let entry = await getJson(store, id); */
  /* if (!entry) { */
  /*   entry = await retry(100).then(() => getJson(store, id)); */
  /* } */
  const entry = store[id];

  const redirectionTarget = {
    true: "/checkout",
    false: "/close",
  };

  if (entry) {
    if (!entry?.closed && connections[id]) {
      if (nonce == entry?.nonce) {
        console.debug("event: submitted");
        connections[id]?.enqueue(`event: submitted\ndata:\n\n`);
        // TODO: is this too fast?
        connections[id]?.close();
        connections[id] = null;
        /* await store.set( */
        /*   id, */
        /*   JSON.stringify({ ...entry, closed: true }), */
        /* ); */
        store[id] = { ...entry, closed: true };
        // redirect to final checkout or close page, depending on whether the flow was started on a mobile or desktop
        // browser
        return new Response(null, {
          status: 302,
          headers: {
            "Location": redirectionTarget[entry.mobile],
          },
        });
      } else {
        console.error("Nonce doesn't match:", id, entry.nonce, nonce);
      }
    } else {
      console.error("Request has already been closed:", id);
    }
  } else {
    console.error("Unknown request id:", id);
  }
  // INFO: Do not return any result so the client doesn't know whether the a message has been sent.
}
