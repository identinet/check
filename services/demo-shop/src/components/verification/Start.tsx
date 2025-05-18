import Shield from "~/components/icons/Shield.tsx";

/**
 * Start displays initial information
 *
 * @param {any} props.action action performed automatically after a short time period.
 * @param {any} props.timeout timeout in milliseconds.
 *
 * Example:
 *
 * ```jsx
 * <Start>{url}></Start>
 * ```
 */
export default function Thanks(props) {
  setTimeout(() => {
    props.action();
  }, props.timeout || 1000);
  return (
    <>
      <div class="text-4xl font-bold text-center">
        Checkout protected by&nbsp;CHECK
      </div>
      <Shield size={2} />
      <div class="text-3xl text-center">Shop with verified&nbsp;trust</div>
    </>
  );
}
