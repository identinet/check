import { createEffect, createResource, onMount } from "solid-js";
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
  let oldText;
  let canvas;
  let render = false;
  const [generatedQRCode] = createResource(
    () => (props.children),
    (source, { value: _value, refetching: _refetching }) => {
      if (source && source != "") {
        const code = generate(source instanceof URL ? source.toString() : source);
        return code;
      }
    },
  );
  const [_, { mutate: _mutate, refetch }] = createResource(
    generatedQRCode,
    (_render) => {
      const code = generatedQRCode();
      if (code && canvas) {
        code.toCanvas(canvas);
      }
    },
  );

  createEffect(() => {
    if (render && oldText !== props.children) {
      oldText = props.children;
      refetch();
    }
  });
  onMount(() => {
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
