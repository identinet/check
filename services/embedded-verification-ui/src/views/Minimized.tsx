import { Component, JSX } from "solid-js";

import Check from "~/components/icons/Check.tsx";
import { useVerificationContext } from "~/components/VerificationContext.tsx";

type Props = {
  toggleView: () => void;
} & JSX.HTMLAttributes<HTMLButtonElement>;

const Minimized: Component<Props> = (props) => {
  const [verificationDetails] = useVerificationContext();
  const verified = verificationDetails()?.verified;
  return (
    <div
      onclick={props.toggleView}
      title="Verification Status"
      classList={{
        [verified ? "from-[#4548FF]" : "from-red-500"]: true,
        [verified ? "via-[#5092FF]" : ""]: true,
        [verified ? "to-[#4CAFFF]" : "to-red-200"]: true,
        [verified ? "border-[#07348F]" : "border-red-900"]: true,
      }}
      class="size-[4rem] md:size-[4rem] bg-linear-10 to-80% flex items-center justify-center border-l border-y rounded-l-lg cursor-pointer"
    >
      <Check size="70%" />
    </div>
  );
};

export default Minimized;
