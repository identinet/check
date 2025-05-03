import { Component, createSignal, Show } from "solid-js";
import VerificationStatus from "./VerificationStatus";
import VerificationDetails from "./VerificationDetails";

import styles from "./App.module.css?no-inline";

const App: Component = () => {
  const [details, setDetails] = createSignal(false);
  const toggleDetails = () => setDetails(!details());
  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <Show
          when={details()}
          fallback={
            <VerificationStatus
              toggleDetails={toggleDetails}
            >
            </VerificationStatus>
          }
        >
          <VerificationDetails toggleDetails={toggleDetails}>
          </VerificationDetails>
        </Show>
      </header>
    </div>
  );
};

export default App;
