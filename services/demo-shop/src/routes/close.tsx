/* import { createSignal } from "solid-js"; */
/* import { onMount } from "solid-js"; */

export default function Callback() {
  /* let [counter, setCounter] = createSignal(1); */
  // onMount(() => {
  //   setTimeout(() => {
  //     /* console.log("closing window"); */
  //     /* globalThis.close(); */
  //     /* alert("closing"); */
  //     console.log("closing");
  //     globalThis.open("", "_self", "");
  //     globalThis.close();
  //   }, 1000);
  // });
  return (
    <section class="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
      <div class="mx-auto container p-8">
        <div>This window can be safely closed.</div>
        <div class="flex gap-10 p-8 wrap">
          {/* <button */}
          {/*   type="button" */}
          {/*   onclick={() => { */}
          {/*     setCounter(counter() + 1); */}
          {/*     window.open("", "_self", ""); */}
          {/*     window.close(); */}
          {/*   }} */}
          {/*   class="flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 inactive" */}
          {/* > */}
          {/*   Discard */}
          {/* </button> */}
          {/* <button */}
          {/*   type="button" */}
          {/*   onclick={() => { */}
          {/*     setCounter(counter() + 1); */}
          {/*     window.close(); */}
          {/*   }} */}
          {/*   class="flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 inactive" */}
          {/* > */}
          {/*   Close me */}
          {/* </button> */}
          {/* <button */}
          {/*   type="button" */}
          {/*   onclick={() => { */}
          {/*     setCounter(counter() + 1); */}
          {/*     globalThis.open("", "_self", ""); */}
          {/*     globalThis.close(); */}
          {/*   }} */}
          {/*   class="flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 inactive" */}
          {/* > */}
          {/*   globalThis Discard */}
          {/* </button> */}
          {/* <button */}
          {/*   type="button" */}
          {/*   onclick={() => { */}
          {/*     setCounter(counter() + 1); */}
          {/*     globalThis.close(); */}
          {/*   }} */}
          {/*   class="flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 inactive" */}
          {/* > */}
          {/*   globalThis Close me */}
          {/* </button> */}
          <button
            type="button"
            onclick={() => {
              globalThis.close();
            }}
            class="flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 inactive"
          >
            Close Window
          </button>
        </div>
        {/* <div> */}
        {/*   Counter: {counter()} */}
        {/* </div> */}
      </div>
    </section>
  );
}
