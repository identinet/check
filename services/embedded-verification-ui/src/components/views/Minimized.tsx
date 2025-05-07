import { Component } from "solid-js";

const Minimized: Component = (props) => {
  const valid = true;
  return (
    <div
      onclick={props.toggleView}
      alt="Verification Status"
      classList={{
        "from-blue-200": valid,
        "to-blue-50": valid,
        "border-blue-900": valid,
        "from-red-200": !valid,
        "to-red-50": !valid,
        "border-red-900": !valid,
      }}
      class="size-[4rem] md:size-[4rem] bg-linear-0 flex items-center justify-center border-l border-y rounded-l-lg cursor-pointer"
    >
      <div
        class="size-[70%] rounded-full bg-linear-0  overflow-hidden"
        classList={{
          "from-blue-700": valid,
          "to-blue-300": valid,
          "from-red-700": !valid,
          "to-red-300": !valid,
        }}
      >
        <div
          class="mx-[5%] -my-[10%]"
          classList={{
            "i-flowbite-check-outline": valid,
            "i-flowbite-close-outline": !valid,
            "size-[110%]": valid,
            "size-[100%]": !valid,
          }}
        >
        </div>
      </div>
    </div>
  );
};

export default Minimized;
