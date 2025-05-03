import { Component } from "solid-js";

import icon from "./assets/verification-status-success.svg?inline";
import styles from "./App.module.css?no-inline";

const VerificationStatus: Component = (props) => {
  return (
    <div onclick={props.toggleDetails} class={styles.verificationStatus}>
      <img
        src={icon}
        class={styles.verificationStatusIcon}
        alt="Verification Status"
      />
    </div>
  );
};

export default VerificationStatus;
