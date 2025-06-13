import "virtual:uno.css";

import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import ConfigProvider from "~/components/ConfigContext";

import { Suspense } from "solid-js";
import Nav from "~/components/Nav";

/* import { initFlowbite } from "flowbite"; */

export default function App() {
  /* onMount(() => { */
  /*   initFlowbite(); */
  /* }); */

  return (
    <Router
      root={(props) => (
        <>
          <Nav />
          <Suspense>
            <ConfigProvider>
              {props.children}
            </ConfigProvider>
          </Suspense>
        </>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
