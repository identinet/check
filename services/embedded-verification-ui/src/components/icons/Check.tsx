import { Component, JSX, Show } from "solid-js";

type Props = {
  verified: boolean;
  size?: number;
  width?: number;
  height?: number;
} & JSX.HTMLAttributes<HTMLDivElement>;

const Check: Component<Props> = (props) => {
  return (
    <Show
      when={props.verified}
      fallback={
        <div
          width={props.size || props.width || 22}
          height={props.size || props.height || 22}
          class="i-flowbite-close-circle-outline text-[3rem]"
        >
        </div>
      }
    >
      <svg
        width={props.size || props.width || 22}
        height={props.size || props.height || 22}
        viewBox="0 0 22 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11.1111 0.0915527C14.3271 0.0915527 17.1884 1.52936 19.1733 3.76327C20.1274 4.78785 20.6147 5.83478 20.9159 6.39532C21.5562 7.77652 21.9388 9.2995 21.9388 10.9192C21.9388 16.889 17.0809 21.7469 11.1111 21.7469C5.14136 21.7469 0.283447 16.889 0.283447 10.9192C0.283447 4.94946 5.14136 0.0915527 11.1111 0.0915527Z"
          fill="url(#paint0_linear_2303_10487)"
        />
        <path
          d="M12.2047 15.1064C11.9026 15.4086 11.5068 15.5596 11.1111 15.5596C10.7154 15.5596 10.3196 15.4086 10.0175 15.1064L6.9239 12.0128C6.31972 11.4086 6.31972 10.4297 6.9239 9.82552C7.52808 9.22134 8.50701 9.22134 9.11119 9.82552L11.1111 11.8255L19.1733 3.76327C17.1884 1.52936 14.3271 0.0915527 11.1111 0.0915527C5.14136 0.0915527 0.283447 4.94946 0.283447 10.9192C0.283447 16.889 5.14136 21.7469 11.1111 21.7469C17.0809 21.7469 21.9388 16.889 21.9388 10.9192C21.9388 9.2995 21.5562 7.77652 20.9159 6.39532L12.2047 15.1064Z"
          fill="url(#paint1_linear_2303_10487)"
        />
        <defs>
          <linearGradient
            id="paint0_linear_2303_10487"
            x1="20.254"
            y1="5.06848"
            x2="10.0857"
            y2="15.092"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.0245118" stop-color="white" stop-opacity="0" />
            <stop offset="0.233648" stop-color="white" />
            <stop offset="1" stop-color="white" />
          </linearGradient>
          <linearGradient
            id="paint1_linear_2303_10487"
            x1="11.1111"
            y1="21.7469"
            x2="11.1111"
            y2="0.0915527"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#5558FF" />
            <stop offset="1" stop-color="#00C0FF" />
          </linearGradient>
        </defs>
      </svg>
    </Show>
  );
};

export default Check;
