import Shield from "~/components/icons/Shield.tsx";
import { useConfigContext } from "~/components/ConfigContext";

/**
 * Pre display additional information.
 *
 * @param {any} props.action action performed when clicking the button.
 *
 * Example:
 *
 * ```jsx
 * <Verify>{url}></Verify>
 * ```
 */
export default function Pre(props) {
  const [config] = useConfigContext();
  return (
    <>
      <div class="text-2xl font-medium text-center">
        To simply checkout, please verify your data
      </div>
      <Shield size={2} />
      <a
        href="#"
        onclick={props.action}
        class="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-linear-10 from-[#5558FF] to-[#00C0FF] hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900 border border-[#1E499E]"
      >
        Verify & Fill
      </a>
      <a href={`${config()?.vsi}/about`} target="_blank" class="text-sm underline">What is CHECK?</a>
    </>
  );
}
