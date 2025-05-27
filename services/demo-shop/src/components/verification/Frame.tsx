/**
 * Frame that holds the children.
 *
 * @param {any} props.children Sub-views, any valid JSX element.
 * @param {Bool} props.subframe Decides wheter to display a subframe.
 *
 * Example:
 *
 * ```jsx
 * <Frame><div>xxx</div></Frame>
 * ```
 */
export default function Frame(props) {
  return (
    <div
      alt="Verification Status"
      classList={{
        "from-[#171AAE]": true,
        "to-[#73B2FF]": true,
        "border-[#E5E7EB]": true,
      }}
      class="w-[30rem] max-w-[80vw] h-[40rem] bg-linear-10 border rounded-lg py-14 px-8"
    >
      <div
        class="w-full h-full flex flex-col items-center justify-center gap-8 c-white md:p-8 p-2"
        classList={{
          "border": props.subframe,
          "rounded-xl": props.subframe,
          "bg-white/20": props.subframe,
        }}
      >
        {props.children}
      </div>
    </div>
  );
}
