import { createEffect, createSignal, onCleanup, Show, Suspense } from "solid-js";
import { createAsync, query, useBeforeLeave, useNavigate } from "@solidjs/router";
import isMobile from "~/lib/isMobile.js";
import process from "node:process";
import Frame from "~/components/verification/Frame.tsx";
import Start from "~/components/verification/Start.tsx";
import Pre from "~/components/verification/Pre.tsx";
import Verify from "~/components/verification/Verify.tsx";
import Thanks from "~/components/verification/Thanks.tsx";

const createAuthorizationRequest = query((mobile) => {
  "use server";
  return fetch(
    `https://${process.env.EXTERNAL_HOSTNAME}/api/authrequests/create?mobile=${mobile}`,
    { method: "POST" },
  ).then((res) =>
    res.json().then(async (authRequest) => {
      console.debug("createAuthorizationRequest response", authRequest);
      return authRequest;
    }).catch((err) => {
      console.error("Error creating authorization request", err);
    })
  ).catch((err) => console.error("createAuthorizationRequest", err));
}, "createAuthorizationRequest");

export default function Credentials() {
  const eventSourceStatusOptions = {
    notEstablished: "not_established",
    established: "established",
    closed: "closed",
    timeout: "timeout",
  };
  const authRequest = createAsync(() => createAuthorizationRequest(isMobile()));
  const navigate = useNavigate();

  const views = {
    START: 0,
    PRE: 1,
    VERIFY: 2,
    THANKS: 3,
  };
  const [view, setView] = createSignal(views.PRE);

  // SSE connection between client and server
  // See https://javascript.info/server-sent-events
  let eventSource: EventSource;
  const [eventSourceStatus, setEventSourceStatus] = createSignal(
    eventSourceStatusOptions.notEstablished,
  );
  createEffect(() => {
    if (authRequest()?.id) {
      eventSource = new EventSource(`/api/sse/${authRequest()?.id}`);
      eventSource.onopen = (event) => {
        console.debug("connection opened", event);
        setEventSourceStatus(eventSourceStatusOptions.established);

        /* function printConnectionStatus() { */
        /*   console.log("eventsource readyState", eventSource.readyState); */
        /*   setTimeout(() => { */
        /*     if (eventSource.readyState != 2) { */
        /*       printConnectionStatus(); */
        /*     } */
        /*   }, 1000); */
        /* } */
        /* printConnectionStatus(); */
      };
      eventSource.onmessage = (event) => {
        if (eventSourceStatus() != eventSourceStatusOptions.established) {
          console.debug("ignoring message, eventsource", eventSourceStatus());
          return;
        }
        console.debug("message", event);
      };
      eventSource.addEventListener("submitted", (event) => {
        if (eventSourceStatus() != eventSourceStatusOptions.established) {
          console.debug(
            "ignoring submitted event, eventsource",
            eventSourceStatus(),
          );
          return;
        }
        console.debug("event submitted", event);
        const url = event.data;
        setEventSourceStatus(eventSourceStatusOptions.closed);
        eventSource?.close();
        setView(views.THANKS);
        setTimeout(() => {
          navigate(url);
        }, 5000);
      });
      eventSource.addEventListener("ping", (event) => {
        if (eventSourceStatus() != eventSourceStatusOptions.established) {
          console.debug(
            "ignoring ping event, eventsource",
            eventSourceStatus(),
          );
          return;
        }
        console.debug("event ping" /* event */);
      });
      eventSource.addEventListener("timeout", (event) => {
        if (eventSourceStatus() != eventSourceStatusOptions.established) {
          console.debug(
            "ignoring timeout event, eventsource",
            eventSourceStatus(),
          );
          return;
        }
        console.debug("event timeout" /* event */);
        setEventSourceStatus(eventSourceStatusOptions.timeout);
        eventSource?.close();
      });
      eventSource.onerror = (err) => {
        if (eventSourceStatus() == eventSourceStatusOptions.closed) {
          console.debug("ignoring error, eventsource", eventSourceStatus());
          return;
        }
        console.error("SSE connection lost. Retrying...", err);
        /* setEventSourceStatus(eventSourceStatusOptions.error); */
        /* eventSource?.close(); */
        /* setTimeout(() => (eventSource = new EventSource("/api/sse")), 3000); */
      };
    }
  });
  onCleanup(() => {
  });
  useBeforeLeave(() => {
    console.debug("useBeforeLeave");
    try {
      setEventSourceStatus(eventSourceStatusOptions.closed);
      eventSource?.close();
      console.debug("connection closed", eventSource);
      if (authRequest()?.id) {
        fetch(`/api/sse/${authRequest()?.id}/cancel`, { method: "POST" }).catch(
          (
            err,
          ) => console.error("Error while canceling request", err),
        );
      }
    } catch (err) {
      console.error("useBeforeLeave", err);
    }
  });

  return (
    <section class="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
      <div class="mx-auto container px-4 2xl:px-0 flex flex-col items-center justify-center gap-10">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
          Pre-Checkout: Requesting Verifying Credentials
        </h2>

        <div class="hidden">
          EventSource status: {eventSourceStatus()}
        </div>

        <div class=" leading-10">
          <Frame>
            <Show
              when={view() === views.START}
              fallback={
                <Show
                  when={view() === views.PRE}
                  fallback={
                    <Show when={view() === views.VERIFY} fallback={<Thanks></Thanks>}>
                      <Verify>{new URL(authRequest()?.url)}</Verify>
                    </Show>
                  }
                >
                  <Pre action={() => setView(views.VERIFY)}></Pre>
                </Show>
              }
            >
              <Start action={() => setView(views.PRE)}></Start>
            </Show>
          </Frame>
        </div>
      </div>
    </section>
  );
}
