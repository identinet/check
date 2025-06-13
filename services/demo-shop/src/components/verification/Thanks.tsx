import Shield from "~/components/icons/Shield.tsx";

/**
 * Thanks display a thank you page.
 *
 * @param {any} props.action action performed when clicking the button.
 *
 * Example:
 *
 * ```jsx
 * <Verify>{url}></Verify>
 * ```
 */
export default function Thanks(_props) {
  return (
    <>
      <div class="text-4xl font-bold text-center">Thank you for verifying!</div>
      <Shield size={2} />
      <div class="text-3xl text-center hidden">Please continue to payment.</div>
      <div class="text-3xl text-center">You will be forwarded to payment.</div>
    </>
  );
}
