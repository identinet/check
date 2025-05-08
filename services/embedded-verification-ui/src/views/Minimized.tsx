import { Component } from "solid-js";

import Check from "~/components/icons/Check";
/* import CheckHtml from "~/components/icons/CheckHtml"; */

const Minimized: Component = (props) => {
  const valid = true;
  /* <CheckHtml valid={valid} /> */
  return (
    <div
      onclick={props.toggleView}
      alt="Verification Status"
      classList={{
        /* "from-[#00C0FF]": valid, */
        "from-blue-200": valid,
        /* "to-[##5558FF]": valid, */
        "to-blue-50": valid,
        "border-[#1E499E]": valid,
        /* "border-blue-900": valid, */
        "from-red-200": !valid,
        "to-red-50": !valid,
        "border-red-900": !valid,
      }}
      class="size-[4rem] md:size-[4rem] bg-linear-10 to-80% flex items-center justify-center border-l border-y rounded-l-lg cursor-pointer"
    >
      <Check size="70%" />
    </div>
  );
};

export default Minimized;
