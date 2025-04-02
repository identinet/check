import { json } from "@solidjs/router";
import type { APIEvent } from "@solidjs/start/server";
import { connections, store } from "~/lib/store.js";
/* import { getJson, getValkeyStore } from "~/lib/store_redis.js"; */

export async function GET(event: APIEvent) {
  console.debug("sse/ID", event.params);

  const id = event.params.id;

  /* INFO: for use with Redis backend */
  /* const store = getValkeyStore(); */
  /* const entry = await getJson(store, id); */
  /* if (!entry) { */
  /*   entry = await retry(100).then(() => getJson(store, id)); */
  /* } */
  const entry = store[id];

  if (entry) {
    if (entry?.closed || connections[id]) {
      console.info(
        "There is already a readable stream for this id, or the stream is closed",
        id,
      );
      return;
    } else {
      console.info("Opening new connection", id);
      const stream = new ReadableStream({
        start(controller) {
          connections[id] = controller;
          const sendKeepAlive = async () => {
            /* const entry = await getJson(store, id); */
            const entry = store[id];
            if (entry && !entry?.closed) {
              console.debug(`Sending keep alive :ping ${id}/${entry.nonce}`);
              controller.enqueue(`:ping\n\n`);
              setTimeout(sendKeepAlive, 1500);
            } else {
              console.debug("Connection closed, stopping keep alive", entry);
            }
          };
          sendKeepAlive();
        },
        cancel(reason) {
          console.debug("Connection canceled", id, reason);
          delete connections[id];
          // TODO: close connection in valkey?
        },
      });
      // Cleanup when the client disconnects
      event.request.signal.addEventListener("abort", async (ev) => {
        console.debug("event.request.signal.addEventListener abort", id, ev);
        /* await store.set(id, JSON.stringify({ closed: true })); */
        store[id].closed = true;
        connections[id]?.close();
        delete connections[id];
      });

      return new Response(stream, {
        headers: {
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Content-Type": "text/event-stream",
        },
      });
    }
  } else {
    console.warn("Ignoring request, ID unknown", id);
  }
}
