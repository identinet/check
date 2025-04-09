import type { APIEvent } from "@solidjs/start/server";
/* import { getJson, getValkeyStore } from "~/lib/store_redis.js"; */
import { connections, store } from "~/lib/store.js";
import { isMethod } from "vinxi/http";

/* function retry(delay: number) { */
/*   return new Promise((resolve) => { */
/*     setTimeout(resolve, delay); */
/*   }); */
/* } */

/**
 * Function submits a navigation request to the connected browser window via the existing SSE connection between client
 * and server, the final step in the authorization flow.
 */
export async function GET(event: APIEvent) {
  console.debug("sse/ID/data", event.params);
  const { id } = event.params;

  /* INFO: for use with Redis backend */
  /* const store = getValkeyStore(); */
  /* let entry = await getJson(store, id); */
  /* if (!entry) { */
  /*   entry = await retry(100).then(() => getJson(store, id)); */
  /* } */
  const entry = store[id];

  return entry?.credentials;
}
