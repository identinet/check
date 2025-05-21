import { Component } from "solid-js";

const Button: Component = (props) => {
  return (
    <a
      alt={props.alt || props.title || ""}
      title={props.title || ""}
      onclick={props.action}
      target={props.target || (props.href ? "_blank" : "")}
      href={props.action ? "#" : (props.href || "")}
      class="bg-white/80 border border-color-[#07348F] p-1 size-[2rem] rounded-full cursor-pointer"
    >
      <div
        class="select-none size-full bg-color-[#07348F] c-[#07348F] text-xl font-bold flex items-center justify-center"
        classList={{ [props.icon]: true }}
      >
        {props.children}
      </div>
    </a>
  );
};

export default Button;
