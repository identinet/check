import { createResource, createSignal, onMount, Show } from "solid-js";
import { generate } from "lean-qr";
import Shield from "~/components/icons/Shield";

/**
 * QRCode renders children as QR code.
 *
 * @param {String} props.children Text that is rendered as QRCode.
 * @param {String} props.class CSS classes applied to the canvas element.
 *
 * Example:
 *
 * ```jsx
 * <QRCode>{data()}</QRCode>
 * ```
 */
export default function QRCode(props) {
  const views = {
    START: 0,
    PRE: 1,
    VERIFy: 2,
    THANKS: 3,
  };
  const [view, setView] = createSignal(views.THANKS);
  let canvas: any;
  let shouldRender = false;
  const [generatedQRCode] = createResource(
    () => (props.children),
    (source, { value, refetching }) => {
      if (source && source != "") {
        const code = generate(source);
        return code;
      }
    },
  );
  const [_, { mutate, refetch }] = createResource(
    generatedQRCode,
    (render) => {
      const code = generatedQRCode();
      if (code && shouldRender) {
        code.toCanvas(canvas);
      }
    },
  );

  onMount(() => {
    shouldRender = true;
    refetch();
  });

  return (
    <>
      <div
        alt="Verification Status"
        classList={{
          "from-[#171AAE]": true,
          "to-[#73B2FF]": true,
          "border-[#E5E7EB]": true,
        }}
        class="w-[30rem] max-w-[80vw] h-[40rem] bg-linear-10 border rounded-lg py-14 px-8"
      >
        <div
          class="w-full h-full flex flex-col items-center justify-center gap-8 c-white p-8"
          classList={{
            "border": view() !== views.START,
            "rounded-xl": view() !== views.START,
            "bg-white/20": view() !== views.START,
          }}
        >
          <Show
            when={view() === views.START}
            fallback={
              <>
                <Show
                  when={view() === views.PRE}
                  fallback={
                    <Show
                      when={view() === views.START}
                      fallback={
                        <>
                          <div class="text-4xl font-bold text-center">Thank you for sharing!</div>
                          <Shield width="180" height="200" />
                          <div class="text-3xl text-center">Please continue to payment.</div>
                        </>
                      }
                    >
                      <>
                        <div class="text-2xl font-medium text-center">
                          Scan with your Mobile&nbsp;Wallet
                        </div>
                        <div class="bg-white/60 rounded-xl p-8 size-60 grow">
                          QR Code
                        </div>
                        <div class="flex flex-col gap-2 items-center">
                          <div class="text-lg font-semibold text-center">
                            Please confirm to share the following information:
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
                        <a href="todo" class="text-sm underline">How to use CHECK?</a>
                      </>
                    </Show>
                  }
                >
                  <div class="text-2xl font-medium text-center">
                    To simply checkout, please verify your data
                  </div>
                  <Shield width="180" height="200" />
                  <a
                    href="todo"
                    class="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-linear-10 from-[#5558FF] to-[#00C0FF] hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900 border border-[#1E499E]"
                  >
                    Verify & Fill
                  </a>
                  <a href="todo" class="text-sm underline">What is CHECK?</a>
                </Show>
              </>
            }
          >
            <div class="text-4xl font-bold text-center">Checkout Protected by&nbsp;CHECK</div>
            <Shield width="180" height="200" />
            <div class="text-3xl text-center">Shop with verified&nbsp;trust</div>
          </Show>
          <canvas
            ref={canvas}
            class="mx-auto p-8 w-full max-w-80 hidden"
            style="image-rendering: pixelated;"
          >
          </canvas>
        </div>
      </div>
    </>
  );
}
