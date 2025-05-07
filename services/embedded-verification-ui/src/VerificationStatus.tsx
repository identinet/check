import { Component, createEffect, createSignal, Show } from "solid-js";

import Minimized from "~/components/views/Minimized.tsx";
import Standard from "~/components/views/Standard.tsx";
import Details from "~/components/views/Details.tsx";

import { useVerificationContext } from "~/components/Context";

import styles from "./App.module.css?no-inline";

const VerificationStatus: Component = (props) => {
  const xx = useVerificationContext();
  const [verificationDetails, { refetch }] = useVerificationContext();
  const views = {
    minimized: 1,
    standard: 2,
    details: 3,
  };
  const [view, setView] = createSignal(views.minimized);
  /* const [view, setView] = createSignal(views.standard); */
  const toggleViewMinimized = () => setView(views.minimized);
  const toggleViewStandard = () => setView(views.standard);
  const toggleViewDetails = () => setView(views.details);
  // TOOD: setup automatic refetch operation after a certain time has passed
  createEffect(() =>
    setInterval(() => {
      console.log("refetching verification");
      console.log("refetching verification", xx);
      /* console.log("refetch", refetch); */
      /* refetch(); */
    }, 10000)
  );
  // show app only if verification status details have become available
  return (
    <div>
      <Show when={verificationDetails()}>
        <div class={styles.App}>
          <header class={styles.header}>
            <Show
              when={view() === views.details}
              fallback={
                <Show
                  when={view() === views.standard}
                  fallback={<Minimized toggleView={toggleViewStandard} />}
                >
                  <Standard
                    close={toggleViewMinimized}
                    toggleView={toggleViewDetails}
                  />
                </Show>
              }
            >
              <Details
                close={toggleViewMinimized}
                toggleView={toggleViewStandard}
              />
            </Show>
          </header>
        </div>
      </Show>
    </div>
  );
};

export default VerificationStatus;
