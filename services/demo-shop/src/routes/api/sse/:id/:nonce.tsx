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
export async function GET(event: APIEvent) {
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
    true: `/checkout/${id}`,
    false: "/close",
  };

  if (entry) {
    if (!entry?.closed && connections[id]) {
      if (nonce == entry?.nonce) {
        console.debug("event: submitted");

        const data = await fetch(
          `https://${process.env.EXTERNAL_VDS_HOSTNAME}/v1/authrequests/${id}`,
          { method: "GET" },
        ).then((res) => res.json()).catch((err) =>
          console.error("An error occurred while fetching the results", id, nonce, err)
        );
        console.log("data", data);
        const encoded_body = data?.vp_token?.split(".")?.at(1);
        let credentials;
        try {
          const body = JSON.parse(atob(encoded_body));
          /* body.vp.verifiableCredential = body?.vp?.verifiableCredential.map((data: string) => { */
          credentials = body?.vp?.verifiableCredential.map((data: string) => {
            const vc_encoded = data?.split(".")?.at(1);
            if (vc_encoded) {
              return JSON.parse(atob(vc_encoded));
            }
            return data;
          });
          console.log("body", body);
        } catch (err) {
          console.error("An error occurred while parsing body", id, nonce, err);
        }

        connections[id]?.enqueue(`event: submitted\ndata: ${redirectionTarget[!entry.mobile]}\n\n`);
        connections[id]?.close();
        connections[id] = null;
        /* await store.set( */
        /*   id, */
        /*   JSON.stringify({ ...entry, closed: true }), */
        /* ); */
        store[id] = { ...entry, closed: true, credentials };
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
