import { Component } from "solid-js";

import icon from "~/assets/verification-status-success-details.svg?inline";
import styles from "~/App.module.css?no-inline";

const Standard: Component = (props) => {
  return (
    <div onclick={props.toggleView} class={styles.verificationDetails}>
      blubblub
      <img
        src={icon}
        class={styles.verificationDetailsIcon}
        alt="Verification Status"
      />
    </div>
  );
};

export default Standard;
