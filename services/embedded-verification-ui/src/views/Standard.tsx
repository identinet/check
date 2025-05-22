import { Component, createSignal } from "solid-js";

import Modal from "~/components/Modal";
import Button from "~/components/Button";
import Shield from "~/components/icons/Shield";
import { useVerificationContext } from "~/components/VerificationContext";
import { useConfigContext } from "~/components/ConfigContext";

const Standard: Component = (props) => {
  const valid = true;
  const [modalVisible, setVisible] = createSignal(false);
  const [config] = useConfigContext();
  // TODO: use verification
  const [verificationDetails, { refetch }] = useVerificationContext();
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
        alt="Verification Status"
        classList={{
          /* "from-blue-200": valid, */
          "from-[#4548FF]": valid,
          "via-[#5092FF]": valid,
          /* "to-blue-50": valid, */
          "to-[#4CAFFF]": valid,
          /* "border-blue-900": valid, */
          "border-[#07348F]": valid,
          "from-red-200": !valid,
          "to-red-50": !valid,
          "border-red-900": !valid,
        }}
        class="relative w-[18rem] max-w-[80vw] h-[10rem] bg-linear-10 border-l border-y rounded-l-4xl"
      >
        <div class="w-full h-full rounded-l-4xl bg-radial from-[#0548DD]/60 to-[#5800FC]/10">
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
            <Shield action={props.toggleView} size={1.2} />
            <Modal show={modalVisible()} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Standard;
