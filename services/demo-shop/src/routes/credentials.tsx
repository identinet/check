import { createEffect, createSignal, onCleanup, Show, Suspense } from "solid-js";
import { createAsync, query, useBeforeLeave, useNavigate } from "@solidjs/router";
import QRCode from "~/components/QRCode";
import isMobile from "~/lib/isMobile.js";
import process from "node:process";

const createAuthorizationRequest = query((mobile) => {
  "use server";
  console.debug("createAuthorizationRequest");
  console.debug("isMobile", mobile);
  return fetch(
    `https://${process.env.EXTERNAL_HOST}//api/authrequests/create?mobile=${mobile}`,
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
  };
  const authRequest = createAsync(() => createAuthorizationRequest(isMobile()));
  const navigate = useNavigate();

  // SSE connection between client and server
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
          console.debug("ignoring event, eventsource", eventSourceStatus());
          return;
        }
        console.debug("event submitted", event);
        const url = "/checkout";
        setEventSourceStatus(eventSourceStatusOptions.closed);
        eventSource?.close();
        navigate(url);
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
    } catch (err) {
      console.error("useBeforeLeave", err);
    }
  });

  return (
    <section class="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
      <div class="mx-auto container px-4 2xl:px-0">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
          Requesting Credentials
        </h2>

        <div>
          EventSource status: {eventSourceStatus()}
        </div>

        <Show
          when={isMobile()}
          fallback={
            <p>
              Please proceed by scanning this QR code from the wallet app on your mobile device.
            </p>
          }
        >
          <p>Please proceed by opening the wallet app.</p>
        </Show>

        <Suspense fallback={<div>Loading...</div>}>
          <Show
            when={isMobile()}
            fallback={
              <QRCode class="mx-auto p-8 w-full max-w-80">
                {authRequest()?.url}
              </QRCode>
            }
          >
            <div class="flex gap-10 p-8 wrap">
              <a
                href={authRequest()?.url}
                class="flex w-full items-center justify-center rounded-lg bg-primary-700 p-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 inactive"
              >
                Open Wallet
              </a>
            </div>
          </Show>
        </Suspense>
      </div>
    </section>
  );
}
