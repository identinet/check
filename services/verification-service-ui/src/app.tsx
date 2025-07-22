import "@unocss/reset/tailwind.css";
import "virtual:uno.css";

import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";

import { Suspense } from "solid-js";
import Nav from "~/components/Nav.tsx";
import Footer from "~/components/Footer.tsx";

export default function App() {
  return (
    <Router
      root={(props) => (
        <div class="font-sans flex flex-col min-h-vh gap-4">
          <Nav />
          <Suspense>{props.children}</Suspense>
          <Footer />
        </div>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
