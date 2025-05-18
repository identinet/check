import { createEffect, createResource, onMount } from "solid-js";
import { generate } from "lean-qr";
/* import { isServer } from "solid-js/web"; */

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
  let oldText;
  let canvas: any;
  let render = false;
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
      /* if (isServer) return; */
      const code = generatedQRCode();
      if (code && canvas) {
        code?.toCanvas(canvas);
      }
    },
  );

  createEffect(() => {
    /* if (isServer) return; */
    if (render && oldText !== props.children) {
      oldText = props.children;
      refetch();
    }
  });
  onMount(() => {
    /* if (isServer) return; */
    render = true;
    refetch();
  });

  return (
    <canvas
      ref={canvas}
      class="w-full"
      style="image-rendering: pixelated;"
    >
    </canvas>
  );
}
