import type { APIEvent } from "@solidjs/start/server";
import { connections, store } from "~/lib/store.js";
/* import { getJson, getValkeyStore } from "~/lib/store_redis.js"; */

export function GET(event: APIEvent) {
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
          const sendKeepAlive = () => {
            /* const entry = await getJson(store, id); */
            const entry = store[id];
            if (entry && !entry?.closed) {
              console.debug(`Sending keep alive ${id}/${entry.nonce}`);
              try {
                controller.enqueue(`event: ping\ndata:\n\n`);
              } catch (err) {
                console.error("Error when sending keep alive", err);
                return;
              }
              setTimeout(sendKeepAlive, /* 5sec ping */ 5000);
            } else {
              console.debug("Connection closed, stopping keep alive", entry);
            }
          };
          sendKeepAlive();
          // automatically close connection after a certain time
          setTimeout(() => {
            const entry = store[id];
            if (entry && !entry?.closed) {
              console.info(
                `Closing connection, timeout reached, ${id}/${entry.nonce}`,
              );
              try {
                controller.enqueue(`event: timeout\ndata:\n\n`);
              } catch (err) {
                console.error("Error when sending timeout", err);
              }
              store[id] = { ...entry, closed: true };
              delete connections[id];
              controller.close();
            }
          }, /* 2min timeout */ 120000);
        },
        cancel(reason) {
          console.debug("Connection canceled", id, reason);
          delete connections[id];
          // TODO: close connection in valkey?
        },
      });
      /* setInterval(() => { */
      /*   console.log("connection status", event.request); */
      /* }, 1000); */
      // Cleanup when the client disconnects
      event.request.signal.addEventListener("close", (ev) => {
        console.debug("event.request.signal.addEventListener close", id, ev);
      });
      event.request.signal.addEventListener("abort", (ev) => {
        console.debug("event.request.signal.addEventListener abort", id, ev);
        /* await store.set(id, JSON.stringify({ closed: true })); */
        const entry = store[id];
        store[id] = { ...entry, closed: true };
        connections[id]?.close();
        delete connections[id];
      });

      /* event.request.signal.timeout(); */
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
