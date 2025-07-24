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
      title={`Verification Status: ${verified ? "verified" : "failed"}`}
      classList={{
        [verified ? "from-[#9ed4ff]" : "from-red-400"]: true,
        [verified ? "via-[#EAF6FF]" : "to-red-50"]: true,
        [verified ? "to-[#EAF6FF]" : "to-red-50"]: true,
        [verified ? "border-[#1E499E]" : "border-red-900"]: true,
      }}
      class="size-[4rem] md:size-[4rem] bg-linear-20 flex items-center justify-center border-l border-y rounded-l-lg cursor-pointer"
    >
      <Check verified={verified} size={48} />
    </div>
  );
};

export default Minimized;
