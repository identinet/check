import QRCode from "../QRCode.tsx";
import { ErrorBoundary } from "solid-js";
import { Suspense } from "solid-js/web";
import isMobile from "~/lib/isMobile.js";
import { useConfigContext } from "~/components/ConfigContext";

/**
 * Verify displays the QR code.
 *
 * @param {any} props.children QR Code URL.
 *
 * Example:
 *
 * ```jsx
 * <Verify>{url}></Verify>
 * ```
 */
export default function Verify(props) {
  const [config] = useConfigContext();
  return (
    <>
      <div class="text-2xl font-medium text-center">
        <Show
          when={!isMobile()}
          fallback={<p>Mobile&nbsp;Wallet</p>}
        >
          <p>Scan with your Mobile&nbsp;Wallet</p>
        </Show>
      </div>
      <Show
        when={!isMobile()}
        fallback={
          <a
            href={props.children}
            class="h-24 inline-flex justify-center justify-items-center items-center rounded-lg bg-primary-700 p-8 py-2.5 text-md font-semibold text-white bg-linear-5 from-[#5558FF] to-[#00C0FF]"
          >
            Open Wallet
          </a>
        }
      >
        <div class="bg-white/60 rounded-xl p-3 size-64">
          <Suspense fallback={<div class="c-black size-58 mx-auto">Loading...</div>}>
            <ErrorBoundary fallback={<div class="c-black Gx-auto">Something went terribly wrong</div>}>
              <QRCode>{props.children}</QRCode>
            </ErrorBoundary>
          </Suspense>
        </div>
      </Show>
      <div class="flex flex-col gap-2 items-center">
        <div class="text-lg font-semibold text-center">
          Please share the following details:
        </div>
        <div class="text-md">
          <ul class="list-disc">
            <li>First and lastname</li>
            <li>Shipping address</li>
            <li>Email address</li>
          </ul>
        </div>
      </div>
      <div class="text-lg font-medium hidden">
        <label>
          <input type="checkbox" class="mx-3" />
          I agree to share this information
        </label>
      </div>
      <a href={new URL(`${config()?.vsi || ""}/about`)} target="_blank" class="text-sm underline">How to use CHECK?</a>
    </>
  );
}
