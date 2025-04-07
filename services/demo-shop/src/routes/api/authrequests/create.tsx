import type { APIEvent } from "@solidjs/start/server";
import { store } from "~/lib/store.js";
/* import { getJson, getValkeyStore } from "~/lib/store_redis.js"; */

export async function POST(event: APIEvent) {
  console.debug("authrequests/create");
  const params = new URL(event.request.url).searchParams;
  const mobile = params.get("mobile") == "true" ? true : false;

  const nonce = crypto.randomUUID();

  /* INFO: for use with Redis backend */
  /* const store = getValkeyStore(); */
  /* let entry = await getJson(store, id); */
  /* if (!entry) { */
  /*   entry = await retry(100).then(() => getJson(store, id)); */
  /* } */

  return fetch(
    `https://${process.env.VDS_HOST}/v1/authrequests?nonce=${nonce}`,
    { method: "POST" },
  ).then((res) =>
    res.json().then(async (authRequest) => {
      console.debug(`Generated nonce ${authRequest.id}/${nonce}`);
      // TODO: test if data doesn't exist yet
      /* await store.set(authRequest.id, JSON.stringify({ nonce, closed: false })); */
      store[authRequest.id] = { nonce, closed: false, mobile };
      return authRequest;
    }).catch((err) => {
      console.error("Error creating authorization request", err);
      return new Response(null, {
        status: 503,
        statusText: "Internal error while generating authorization request",
      });
    })
  );
}
