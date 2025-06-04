import { Component } from "solid-js";

import Check from "~/components/icons/Check";
import { useVerificationContext } from "~/components/VerificationContext";

const Minimized: Component = (props) => {
  const [verificationDetails, { refetch }] = useVerificationContext();
  const verified = verificationDetails()?.verified;
  return (
    <div
      onclick={props.toggleView}
      alt="Verification Status"
      classList={{
        /* "from-[#00C0FF]": valid, */
        "from-blue-200": verified,
        /* "to-[##5558FF]": valid, */
        "to-blue-50": verified,
        "border-[#1E499E]": verified,
        /* "border-blue-900": valid, */
        "from-red-400": !verified,
        "to-red-200": !verified,
        "border-red-900": !verified,
      }}
      class="size-[4rem] md:size-[4rem] bg-linear-10 to-80% flex items-center justify-center border-l border-y rounded-l-lg cursor-pointer"
    >
      <Check size="70%" />
    </div>
  );
};

export default Minimized;
