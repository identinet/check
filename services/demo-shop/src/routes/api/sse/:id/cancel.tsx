import type { APIEvent } from "@solidjs/start/server";
/* import { getJson, getValkeyStore } from "~/lib/store_redis.js"; */
import { connections, store } from "~/lib/store.js";

/* function retry(delay: number) { */
/*   return new Promise((resolve) => { */
/*     setTimeout(resolve, delay); */
/*   }); */
/* } */

/**
 * Function cancels the open SSE connection to the browser, e.g. when the client navigates away.
 */
export function POST(event: APIEvent) {
  console.debug("sse/ID", event.params);
  const { id } = event.params;

  /* INFO: for use with Redis backend */
  /* const store = getValkeyStore(); */
  /* let entry = await getJson(store, id); */
  /* if (!entry) { */
  /*   entry = await retry(100).then(() => getJson(store, id)); */
  /* } */
  const entry = store[id];

  if (entry) {
    if (!entry?.closed && connections[id]) {
      console.debug("event: cancel");
      connections[id]?.close();
      connections[id] = null;
      /* await store.set( */
      /*   id, */
      /*   JSON.stringify({ ...entry, closed: true }), */
      /* ); */
      store[id] = { ...entry, closed: true };
      // redirect to final checkout or close page, depending on whether the flow was started on a mobile or desktop
      // browser
      return new Response(null, { status: 200 });
    } else {
      console.error("Request has already been closed:", id);
    }
  } else {
    console.error("Unknown request id:", id);
  }
  // INFO: Do not return any result so the client doesn't know whether the a message has been sent.
}
