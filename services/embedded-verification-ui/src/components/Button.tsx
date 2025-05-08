import { Component } from "solid-js";

const Button: Component = (props) => {
  return (
    <div
      onclick={props.action}
      class="bg-white/80 border border-color-[#07348F] p-1 size-[2rem] rounded-full cursor-pointer"
    >
      <div
        class="size-full bg-color-[#07348F] c-[#07348F] text-xl font-bold flex items-center justify-center"
        classList={{ [props.icon]: true }}
      >
        {props.children}
      </div>
    </div>
  );
};

export default Button;
