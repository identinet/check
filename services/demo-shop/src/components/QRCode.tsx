import { createResource, onMount } from "solid-js";
import { generate } from "lean-qr";

/**
 * QRCode renders children as QR code.
 *
 * @param {String} props.children Text that is rendered as QRCode.
 * @param {String} props.class CSS classes applied to the canvas element.
 *
 * Example:
 *
 * ```jsx
 * <QRCode>{data()}</QRCode>
 * ```
 */
export default function QRCode(props) {
  let canvas: any;
  let shouldRender = false;
  const [generatedQRCode] = createResource(
    () => (props.children),
    (source, { value, refetching }) => {
      if (source && source != "") {
        const code = generate(source);
        return code;
      }
    },
  );
  const [_, { mutate, refetch }] = createResource(
    generatedQRCode,
    (render) => {
      const code = generatedQRCode();
      if (code && shouldRender) {
        code.toCanvas(canvas);
      }
    },
  );

  onMount(() => {
    shouldRender = true;
    refetch();
  });

  return (
    <canvas
      ref={canvas}
      class={props.class || "w-80 y-80"}
      style="image-rendering: pixelated;"
    >
    </canvas>
  );
}
