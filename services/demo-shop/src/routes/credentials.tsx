import { onMount } from "solid-js";
import { generate } from "lean-qr";

export default function Credentials() {
  let qrcode: any;
  const code = generate("go for it");

  onMount(() => {
    try {
      code.toCanvas(qrcode);
    } catch (err) {
      console.error(err);
    }
  });

  return (
    <section class="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
      <div class="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
          Requesting Credentials
        </h2>

        <canvas
          ref={qrcode}
          class="w-80 y-80"
          style="image-rendering: pixelated;"
        >
        </canvas>
      </div>
    </section>
  );
}
