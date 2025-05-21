import { Component } from "solid-js";
import { isServer } from "solid-js/web";

import Modal from "~/components/Modal";
import Card from "~/components/Card";
import Button from "~/components/Button";
import Shield from "~/components/icons/Shield";
import { useVerificationContext } from "~/components/Context.tsx";
import { createSignal } from "solid-js";

const Details: Component = (props) => {
  if (isServer) return;
  const [modalVisible, setVisible] = createSignal(false);
  const valid = true;
  const [verificationDetails, url, { refetch }] = useVerificationContext();
  const identityUrl = new URL(document.URL);
  const checkUrl = new URL(url);
  checkUrl.searchParams.set("url", identityUrl.origin);
  const aboutUrl = new URL(url);
  aboutUrl.pathname = "/about";
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
        class="relative w-[32rem] h-[35rem] max-w-[80vw] bg-linear-10 border-l border-y rounded-l-4xl"
      >
        <div class="w-full h-full flex items-center justify-center blur-xs">
          {/* Shield background */}
          <Shield size={3.0} />
        </div>
        <div class="absolute top-0 w-full h-full rounded-l-4xl bg-radial from-[#0548DD]/60 to-[#5800FC]/10">
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
              About the Retailer
            </div>
            <div class="flex flex-nowrap flex-row gap-3 items-end justify-end flex-none">
              <Button
                actionx={() => setVisible(!modalVisible())}
                href={aboutUrl}
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
                <Card
                  classList={{ "max-sm:hidden": true }}
                  title="Awards:"
                  value="Outstanding Service 2025"
                  issuer="identinet GmbH"
                />
                <Card
                  classList={{ "max-sm:hidden": true }}
                  title="Return Policy:"
                  value="Mail & In Store - Full Refund"
                  issuer="Demo Shop"
                />
              </div>
              <Modal fontLarge={true} show={modalVisible()} />
            </div>
          </div>
          <div class="">
            {/* Footer */}
            <a
              href={checkUrl}
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
