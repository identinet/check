import "@unocss/reset/tailwind.css";
import "virtual:uno.css";

import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";

import { onMount, Suspense } from "solid-js";
import Nav from "~/components/Nav";

import { initFlowbite } from "flowbite";

export default function App() {
  onMount(() => {
    initFlowbite();
  });

  return (
    <Router
      root={(props) => (
        <>
          <Nav />
          <Suspense>{props.children}</Suspense>
        </>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
