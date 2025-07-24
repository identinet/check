import { Component, JSX } from "solid-js";

type Props = {
  data: object;
  classList?: object;
} & JSX.HTMLAttributes<HTMLDivElement>;

const Card: Component<Props> = (props) => {
  return (
    <div
      class="p-2 size-[10rem] border-2 border-white rounded-xl bg-white/30 flex flex-col text-xs backdrop-blur-sm overflow-hidden"
      classList={props.classList || {}}
    >
      <div class="">{props.data.title}</div>
      <div class="text-lg grow">{props.data.value}</div>
      <div class="">Credential Issuer:</div>
      <div class="text-lg">{props.data.issuer}</div>
    </div>
  );
};

export default Card;
