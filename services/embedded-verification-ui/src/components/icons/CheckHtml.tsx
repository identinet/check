import { Component, JSX } from "solid-js";

type Props = {
  valid: boolean;
} & JSX.HTMLAttributes<HTMLDivElement>;

const CheckHtml: Component<Props> = (props) => {
  return (
    <div
      class="size-[70%] rounded-full bg-linear-10 to-90% overflow-hidden"
      classList={{
        /* "from-[#00C0FF]": props.valid, */
        "from-blue-700": props.valid,
        /* "to-[##5558FF]": props.valid, */
        "to-blue-300": props.valid,
        "from-red-700": !props.valid,
        "to-red-300": !props.valid,
      }}
    >
      <div
        class="mx-[5%] -my-[10%]"
        classList={{
          "i-flowbite-check-outline": props.valid,
          "i-flowbite-close-outline": !props.valid,
          "size-[110%]": props.valid,
          "size-[100%]": !props.valid,
        }}
      >
      </div>
    </div>
  );
};

export default CheckHtml;
