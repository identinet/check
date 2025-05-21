import { Component, createEffect, createSignal, Show } from "solid-js";

import Minimized from "~/views/Minimized.tsx";
import Standard from "~/views/Standard.tsx";
import Details from "~/views/Details.tsx";
import isMobile from "~/lib/isMobile.js";

import { useVerificationContext } from "~/components/Context";

import styles from "./App.module.css?no-inline";

const VerificationStatus: Component = (_props) => {
  const xx = useVerificationContext();
  const [verificationDetails, _url, { refetch }] = useVerificationContext();
  const views = {
    minimized: 1,
    standard: 2,
    details: 3,
  };
  const [view, setView] = createSignal(
    isMobile() ? views.minimized : views.standard,
  );
  const toggleViewMinimized = () => setView(views.minimized);
  const toggleViewStandard = () => setView(views.standard);
  const toggleViewDetails = () => setView(views.details);
  createEffect(() =>
    setInterval(() => {
      // TOOD: automatic refetch operation after a certain time has passed
      console.log("refetching verification");
      console.log("refetching verification", xx);
      console.log("refetch", refetch);
      refetch();
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
