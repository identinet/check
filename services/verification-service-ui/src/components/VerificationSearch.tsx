import { createEffect, Show } from "solid-js";
import {
  action,
  useAction,
  useSearchParams,
  useSubmission,
} from "@solidjs/router";
import { useForm } from "~/utils/forms/validation";
import VerificationResult from "~/components/VerificationResult";
import process from "node:process";

const verifyUrlAction = action(async (formData: FormData) => {
  "use server";
  const input = formData.get("url") as string;

  const demoResult = await handleDemoUrl(input);
  if (demoResult) return demoResult;

  const response = await fetch(
    `https://${process.env.API_HOST}/v1/verification?url=${input}`,
  );

  if (!response.ok) throw new Error(response.statusText);

  return response.json();
}, "verifyUrl");

const handleDemoUrl = async (url: string) => {
  // TODO remove test data handler
  if (url == "https://no-id-example.identinet.io") {
    throw new Error("Not found");
  } else if (url == "https://id-example.identinet.io") {
    return {
      status: "NO_CREDENTIAL",
      presentation: {
        verifiableCredential: [],
      },
    };
  } else if (url == "https://id-plus-example.identinet.io") {
    const presentationUrl =
      "https://id-plus-well-known-example.identinet.io/.well-known/presentation.json";
    const response = await fetch(presentationUrl);
    if (!response.ok) throw new Error(response.statusText);
    /* return response.json(); */
    return {
      status: "CREDENTIAL",
      presentation: await response.json(),
    };
  } else if (url == "https://broken-example.identinet.io") {
    const presentationUrl =
      "https://id-broken-plus-well-known-example.identinet.io/.well-known/presentation.json";
    const response = await fetch(presentationUrl);
    if (!response.ok) throw new Error(response.statusText);
    /* return response.json(); */
    return {
      status: "NOT_VERIFIED",
      presentation: await response.json(),
    };
  }
};

const ErrorMessage = (props) => (
  <p class="mt-2 text-sm text-red-600 dark:text-red-500">
    <span class="font-medium">Oops!</span> {props.error}
  </p>
);

export default function VerificationSearch() {
  const verifyUrl = useAction(verifyUrlAction);
  const submission = useSubmission(verifyUrlAction);
  const [searchParams, setSearchParams] = useSearchParams();

  // deno-lint-ignore no-unused-vars
  const { validate, formSubmit, errors } = useForm({
    errorClass: "error-input",
  });
  const isHttpsUrl = ({ value }) => {
    try {
      const url = new URL(value);
      return (url.protocol != "https:") && "Please enter a 'https' URL";
    } catch (_e) {
      return `${value} is not a valid URL`;
    }
  };
  const submit = (form) => {
    const formData = new FormData(form);
    const url = formData.get("url") as string;
    setSearchParams({ url });
    verifyUrl(formData);
  };

  createEffect(() => {
    if (searchParams.url) {
      const formData = new FormData();
      formData.set("url", searchParams.url);
      verifyUrl(formData);
    }
  });

  return (
    <>
      <form use:formSubmit={submit} class="max-w-md mx-auto">
        <label
          for="url-input"
          class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
        >
          Enter website address
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg
              class="w-4 h-4 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
          </div>
          <input
            id="url-input"
            type="url"
            name="url"
            class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="https://www.acme.co"
            value={searchParams.url}
            required
            use:validate={[isHttpsUrl]}
          />
          <button
            type="submit"
            disabled={submission.pending || errors.url}
            class="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            CHECK!
          </button>
        </div>
        {errors.url && <ErrorMessage error={errors.url} />}
      </form>

      <Show when={submission.pending}>
        {() => <VerificationResult pending="true" />}
      </Show>

      <Show when={submission.error}>
        {(error) => <VerificationResult error={error()} />}
      </Show>

      <Show when={submission.result}>
        {(result) => <VerificationResult result={result()} />}
      </Show>
    </>
  );
}
