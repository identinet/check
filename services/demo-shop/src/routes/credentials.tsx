import { createEffect, createSignal, onMount, Suspense } from "solid-js";
import { createAsync, query } from "@solidjs/router";
import QRCode from "~/components/QRCode";

const createSession = query(() => {
  "use server";
  console.log("called quer");
  return fetch(`https://${process.env.VDS_HOST}/v1/sessions`, {
    method: "PUT",
  }).then((
    r,
  ) => {
    console.log("go", r.body);
    return r.json().then((res) => {
      console.log("res", res);
      return res;
    });
  });
});

export default function Credentials() {
  const session = createAsync(() => createSession());

  const [value, setvalue] = createSignal("moin");
  /* setInterval(() => setvalue(new Date().toString()), 150); */

  return (
    <section class="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
      <div class="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
          Requesting Credentials
        </h2>

        <Suspense fallback={<div>Loading...</div>}>
          <QRCode>{session()?.url}</QRCode>
          URL: {JSON.stringify(session()?.url)}
        </Suspense>
      </div>
    </section>
  );
}
