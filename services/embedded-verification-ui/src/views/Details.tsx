import { Component, JSX, Show } from "solid-js";
import { isServer } from "solid-js/web";
import { credentialToRenderData, hasKnownType } from "~/lib/vc2data.js";

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
} & JSX.HTMLAttributes<HTMLDivElement>;

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
        title={`Verification Status: ${verified ? "verified" : "failed"}`}
        classList={{
          [verified ? "from-[#4548FF]" : "from-red-500"]: true,
          [verified ? "via-[#5092FF]" : ""]: true,
          [verified ? "to-[#4CAFFF]" : "to-red-200"]: true,
          [verified ? "border-[#07348F]" : "border-red-900"]: true,
        }}
        class="relative w-[23rem] h-[28rem] max-w-[80vw] bg-linear-10 border-l border-y rounded-l-4xl"
      >
        <div class="absolute top-0 w-full h-full flex items-center justify-center blur-xs">
          <Show
            when={verified}
            fallback={
              <div class="i-flowbite-close-circle-outline text-[16rem]">
              </div>
            }
          >
            {/* Shield background */}
            <Shield size={3.0} />
          </Show>
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

        <div class="absolute top-0 p-2 w-full h-full grid grid-rows-[3rem_minmax(3rem,1fr)_1rem] items-center">
          <div class="flex flex-row w-full overflow-hidden gap-3">
            {/* Navbar */}
            <Button
              title="Close"
              action={props.close}
              icon="i-flowbite-close-outline"
            />
            <div class="grow text-2xl text-center tracking-normal font-bold">
              <span class="max-sm:hidden">About the</span> Merchant
            </div>
            <Button
              /* action={() => setVisible(!modalVisible())} */
              href={aboutUrl()}
              title="Learn about CHECK"
            >
              ?
            </Button>
          </div>
          <div class="relative grow">
            <div class="gap-4 flex flex-wrap flex-col items-center justify-center cursor-pointer overflow-hidden">
              {/* Cards */}
              <div
                onclick={props.toggleView}
                class="gap-3 flex flex-wrap items-center justify-center"
              >
                <For
                  each={verificationDetails()?.credentials?.reduce(
                    (acc, vc) => {
                      if (acc.length > 4) return;
                      const [known, type] = hasKnownType(vc);
                      if (known) {
                        const data = credentialToRenderData[type](vc);
                        acc.push(data);
                      }
                      return acc;
                    },
                    [],
                  ) || []}
                  fallback={<div class="text-gray-500">Loading...</div>}
                >
                  {(data, idx) => (
                    <div class={idx() > 1 ? "max-sm:hidden" : ""}>
                      <Card
                        data={data}
                      />
                    </div>
                  )}
                </For>
              </div>
              <Modal fontLarge show={modalVisible()} />
            </div>
          </div>
          <div class="pb-2">
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
