import { Component, createSignal, JSX, Show } from "solid-js";

import Modal from "~/components/Modal.tsx";
import Button from "~/components/Button.tsx";
import Shield from "~/components/icons/Shield.tsx";
import { useVerificationContext } from "~/components/VerificationContext.tsx";
import { useConfigContext } from "~/components/ConfigContext.tsx";

type Props = {
  close: () => void;
  toggleView: () => void;
} & JSX.HTMLAttributes<HTMLDivElement>;

const Standard: Component<Props> = (props) => {
  const [modalVisible, setVisible] = createSignal(false);
  const [config] = useConfigContext();
  const [verificationDetails] = useVerificationContext();
  const verified = verificationDetails()?.verified;
  const aboutUrl = () => {
    if (config()) {
      const url = new URL(config().vsi);
      url.pathname = "/about";
      return url;
    }
  };
  return (
    <>
      <div
        title={`Verification Status: ${verified ? "verified" : "failed"}`}
        classList={{
          [verified ? "from-[#4548FF]" : "from-red-500"]: true,
          [verified ? "via-[#5092FF]" : ""]: true,
          [verified ? "to-[#4CAFFF]" : "to-red-200"]: true,
          [verified ? "border-[#07348F]" : "border-red-900"]: true,
        }}
        class="relative w-[18rem] max-w-[80vw] h-[10rem] bg-linear-10 border-l border-y rounded-l-4xl"
      >
        <div
          class="w-full h-full rounded-l-4xl bg-radial"
          classList={{
            "from-[#0548DD]/60": verified,
            "to-[#5800FC]/10": verified,
          }}
        >
          {/* Radial gradient that helps increase the readibility of the cards  */}
        </div>

        <div class="absolute top-0 w-full h-full grid grid-rows-[2rem_minmax(2rem,1fr) grid-col-1] items-center">
          <div class="z-1 absolute top-0 p-2 gap-3 flex flex-row w-full items-start justify-center max-h-[2rem]">
            {/* Navbar */}
            <div class="flex flex-nowrap flex-row gap-2 items-start justify-start grow">
              <Button
                title="Close"
                action={props.close}
                icon="i-flowbite-close-outline"
              />
            </div>
            <div class="flex flex-nowrap flex-row gap-2 items-end justify-end">
              <Button
                actionx={() => setVisible(!modalVisible())}
                href={aboutUrl()}
                title="Learn about CHECK"
                /* icon="i-flowbite-arrow-up-right-down-left-solid" */
              >
                ?
              </Button>
              <div class="hidden">
                <Button
                  action={() => setVisible(!modalVisible())}
                  icon="i-flowbite-cog-outline"
                />
              </div>
            </div>
          </div>
          <div class="relative w-full h-full flex items-center justify-center overflow-hidden">
            <Show
              when={verified}
              fallback={
                <div
                  class="i-flowbite-close-circle-outline text-[8rem] cursor-pointer"
                  onclick={props.toggleView}
                >
                </div>
              }
            >
              <Shield action={props.toggleView} size={1.2} />
              <Modal show={modalVisible()} />
            </Show>
          </div>
        </div>
      </div>
    </>
  );
};

export default Standard;
