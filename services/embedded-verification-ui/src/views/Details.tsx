import { Component, JSX } from "solid-js";
import { isServer } from "solid-js/web";

import Modal from "~/components/Modal.tsx";
import Card from "~/components/Card.tsx";
import Button from "~/components/Button.tsx";
import Shield from "~/components/icons/Shield.tsx";
import { useVerificationContext } from "~/components/VerificationContext.tsx";
import { createSignal } from "solid-js";
import { useConfigContext } from "~/components/ConfigContext.tsx";

type Props = {
  close: () => void;
  toggleView: () => void;
} & JSX.HTMLAttributes<HTMLButtonElement>;

const Details: Component<Props> = (props) => {
  if (isServer) return;
  const [modalVisible, _setVisible] = createSignal(false);
  const [config] = useConfigContext();
  const [verificationDetails, { refetch: _refetch }] = useVerificationContext();
  const verified = verificationDetails()?.verified;
  const checkUrl = () => {
    if (config()) {
      const url = new URL(config().vsi);
      url.searchParams.set("q", new URL(document.URL).origin);
      return url.toString();
    }
  };
  const aboutUrl = () => {
    if (config()) {
      const url = new URL(config().vsi);
      url.pathname = "/about";
      return url.toString();
    }
  };
  return (
    <>
      <div
        title="Verification Status"
        classList={{
          [verified ? "from-[#4548FF]" : "from-red-500"]: true,
          [verified ? "via-[#5092FF]" : ""]: true,
          [verified ? "to-[#4CAFFF]" : "to-red-200"]: true,
          [verified ? "border-[#07348F]" : "border-red-900"]: true,
        }}
        class="relative w-[32rem] h-[35rem] max-w-[80vw] bg-linear-10 border-l border-y rounded-l-4xl"
      >
        <div class="w-full h-full flex items-center justify-center blur-xs">
          {/* Shield background */}
          <Shield size={3.0} />
        </div>
        <div
          class="absolute top-0 w-full h-full rounded-l-4xl bg-radial"
          classList={{
            "from-[#0548DD]/60": verified,
            "to-[#5800FC]/10": verified,
          }}
        >
          {/* Radial gradient that helps increase the readibility of the cards  */}
        </div>

        <div class="absolute top-0 p-3 w-full h-full gap-2 grid grid-rows-[3rem_minmax(3rem,1fr)_1rem] items-center justify-center">
          <div class="gap-3 flex w-full items-start justify-center h-full overflow-hidden">
            {/* Navbar */}
            <div class="flex flex-nowrap flex-row gap-3 items-start justify-start flex-none">
              <Button
                title="Close"
                action={props.close}
                icon="i-flowbite-close-outline"
              />
            </div>
            <div class="grow font-bold text-3xl text-center tracking-normal font-extrabold">
              <span class="max-sm:hidden">About the</span> Retailer
            </div>
            <div class="flex flex-nowrap flex-row gap-3 items-end justify-end flex-none">
              <Button
                actionx={() => setVisible(!modalVisible())}
                href={aboutUrl()}
                title="Learn about CHECK"
              >
                ?
              </Button>
            </div>
          </div>
          <div class="relative ">
            <div class="gap-4 flex flex-wrap flex-col items-center justify-center cursor-pointer overflow-hidden">
              {/* Cards */}
              <div
                onclick={props.toggleView}
                class="gap-4 flex flex-wrap items-center justify-center"
              >
                <Card
                  title="Registered Organization:"
                  value="2025-05-16"
                  issuer="identinet GmbH"
                />
                <Card
                  title="Company Location:"
                  value="Shopping City, DE"
                  issuer="Demo Shop"
                />
                <div class="max-sm:hidden">
                  <Card
                    title="Awards:"
                    value="Outstanding Service 2025"
                    issuer="identinet GmbH"
                  />
                </div>
                <div class="max-sm:hidden">
                  <Card
                    title="Return Policy:"
                    value="Mail & In Store - Full Refund"
                    issuer="Demo Shop"
                  />
                </div>
              </div>
              <Modal fontLarge show={modalVisible()} />
            </div>
          </div>
          <div class="">
            {/* Footer */}
            <a
              href={checkUrl()}
              target="_blank"
              class="text-sm underline flex flex-nowrap items-center justify-center gap-1 c-white"
            >
              View Full CHECK Report
              <div class="i-flowbite-arrow-up-right-from-square-outline">
              </div>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Details;
