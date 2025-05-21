import { Component } from "solid-js";

const Card: Component = (props) => {
  return (
    <div
      class="p-3 w-[14rem] h-[13rem] max-h-3xs max-w-3xs gap-1 border-3 border-white rounded-xl bg-white/30 flex flex-col text-lg backdrop-blur-sm"
      classList={props.classList || {}}
    >
      <div>{props.title}</div>
      <div class="text-3xl text-semibold grow">{props.value}</div>
      <div>Credential Issuer:</div>
      <div class="text-1xl">{props.issuer}</div>
    </div>
  );
};

export default Card;
