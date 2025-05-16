import { Component } from "solid-js";

const Modal: Component = (props) => {
  return (
    <div
      class="absolute w-full h-full flex-col items-center justify-center gap-2 bg-radial from-blue-800/80"
      classList={{
        [props.show ? "flex" : "hidden"]: true,
      }}
    >
      <div
        class="text-bold"
        classList={{
          "text-2xl": !props.fontLarge || true,
          "text-4xl": props.fontLarge || false,
        }}
      >
        Retailer Verified
      </div>
      <div
        classList={{
          "text-xl": !props.fontLarge || true,
          "text-2xl": props.fontLarge || false,
        }}
      >
        Enjoy secured shopping!
      </div>
    </div>
  );
};

export default Modal;
