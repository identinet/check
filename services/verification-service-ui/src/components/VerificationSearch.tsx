import { createEffect, onMount, Show } from "solid-js";
import {
  action,
  useAction,
  useSearchParams,
  useSubmission,
} from "@solidjs/router";
import { useForm } from "~/utils/forms/validation";
import VerificationResult from "~/components/VerificationResult";
import process from "node:process";
import { initDropdowns } from "flowbite";

const demoSites = [
  [
    "https://no-id-example.identinet.io",
    "No DID document available",
    (_url) => {
      throw new Error("Not found");
    },
  ],
  [
    "https://id-well-known-example.identinet.io",
    "DID document available, no credentials",
    (_url) => (
      {
        status: "NO_CREDENTIAL",
        presentation: {
          verifiableCredential: [],
        },
      }
    ),
  ],
  [
    "https://id-plus-well-known-example.identinet.io",
    "DID document available, multiple credentials",
    async (url) => {
      const presentationUrl = `${url}/.well-known/presentation.json`;
      const response = await fetch(presentationUrl);
      if (!response.ok) throw new Error(response.statusText);
      /* return response.json(); */
      return {
        status: "CREDENTIAL",
        presentation: await response.json(),
      };
    },
  ],
  [
    "https://id-broken-plus-well-known-example.identinet.io",
    "DID document available, invalid credential",
    async (url) => {
      const presentationUrl = `${url}/.well-known/presentation.json`;
      const response = await fetch(presentationUrl);
      if (!response.ok) throw new Error(response.statusText);
      /* return response.json(); */
      return {
        status: "NOT_VERIFIED",
        presentation: await response.json(),
      };
    },
  ],
];

const handleDemoUrl = async (url: string) => {
  const [u, _t, handler] = demoSites.find(([u]) => u == url) || [];
  if (!handler) return null;
  return await handler(u);
};

const verifyUrlAction = action(async (formData: FormData) => {
  "use server";
  let input = formData.get("url") as string;

  const demoResult = await handleDemoUrl(input);
  if (demoResult) return demoResult;

  // TODO rework, for time being API expects https URLs
  if (input.indexOf("http") != 0) {
    input = `https://${input}`;
  }

  const response = await fetch(
    `https://${process.env.EXTERNAL_API_HOSTNAME}/v1/verification?url=${input}`,
  );

  if (!response.ok) throw new Error(response.statusText);

  return response.json();
}, "verifyUrl");

const ErrorMessage = (props) => (
  <p class="mt-2 text-sm text-red-600 dark:text-red-500">
    <span class="font-medium">Oops!</span> {props.error}
  </p>
);

export default function VerificationSearch() {
  const verifyUrl = useAction(verifyUrlAction);
  const submission = useSubmission(verifyUrlAction);
  const [searchParams, setSearchParams] = useSearchParams();

  onMount(() => {
    initDropdowns();
  });

  // deno-lint-ignore no-unused-vars
  const { validate, formSubmit, errors, resetErrors } = useForm({
    errorClass: "error-input",
  });
  const isValidInput = ({ value }) => {
    // prepend https:// if value does not beging with http or https
    // this allows us to parse the value as an URL
    if (value.indexOf("http") != 0) {
      value = `https://${value}`;
    }
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
      resetErrors();
      const formData = new FormData();
      formData.set("url", searchParams.url);
      verifyUrl(formData);
    }
  });

  return (
    <>
      <form use:formSubmit={submit} class="max-w-md mx-auto mb-8">
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
            type="search"
            name="url"
            class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="https://www…"
            value={searchParams.url || ""}
            required
            use:validate={[isValidInput]}
          />
          <button
            type="submit"
            disabled={submission.pending || errors.url}
            class="text-white absolute end-2.5 bottom-2.5 bg-primary-300 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2"
          >
            CHECK!
          </button>
        </div>
        {errors.url && <ErrorMessage error={errors.url} />}
      </form>

      <span class="text-xs">
        Enter the shop URL to see listed credentials. Or pick an&nbsp;

        <button
          id="dropdownHoverButton"
          data-dropdown-toggle="dropdownHover"
          data-dropdown-trigger="hover"
          class="focus:outline-none text-primary-500 text-xs"
          type="button"
        >
          example site
        </button>
        .
      </span>

      <div
        id="dropdownHover"
        class="z-10 hidden bg-gray-50 divide-y divide-gray-100 rounded-lg shadow-sm"
      >
        <ul
          class="text-sm text-gray-700"
          aria-labelledby="dropdownHoverButton"
        >
          <For each={demoSites}>
            {([url, title]) => (
              <li>
                <a
                  href={`/?url=${url}`}
                  class="block p-1 hover:underline"
                >
                  {title}
                </a>
              </li>
            )}
          </For>
        </ul>
      </div>

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
