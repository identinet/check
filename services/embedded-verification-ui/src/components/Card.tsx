import { Component, JSX } from "solid-js";

type Props = {
  data: object;
  classList?: object;
} & JSX.HTMLAttributes<HTMLButtonElement>;

const Card: Component<Props> = (props) => {
  return (
    <div
      class="p-3 w-[14rem] h-[13rem] max-h-3xs max-w-3xs gap-1 border-3 border-white rounded-xl bg-white/30 flex flex-col text-lg backdrop-blur-sm"
      classList={props.classList || {}}
    >
      <div>{props.data.title}</div>
      <div class="text-3xl text-semibold grow">{props.data.value}</div>
      <div>Credential Issuer:</div>
      <div class="text-1xl">{props.data.issuer}</div>
    </div>
  );
};

export default Card;
