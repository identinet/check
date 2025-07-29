import { createEffect, ErrorBoundary, For, Show, Suspense } from "solid-js";
import {
  action,
  useAction,
  useSearchParams,
  useSubmission,
} from "@solidjs/router";
import { useForm } from "~/utils/forms/validation.tsx";
import VerificationResult from "~/components/VerificationResult.tsx";
import process from "node:process";
/* import { initDropdowns } from "flowbite"; */
import { ErrorCard } from "./ErrorCard.tsx";

const fetchDemoResult = async (url) => {
  const documentUrl = `${url}/.well-known/did-configuration.json`;
  const documentResponse = await fetch(documentUrl);
  const didDocument = documentResponse.ok
    ? await documentResponse.json()
    : null;

  let credentials = [];
  if (didDocument) {
    const presentationUrl = `${url}/.well-known/presentation.json`;
    const presentationResponse = await fetch(presentationUrl);
    const presentation = presentationResponse.ok
      ? await presentationResponse.json()
      : null;
    credentials = presentation?.verifiableCredential || [];
  }

  return {
    documents: didDocument ? [didDocument] : [],
    credentials,
    results: [
      ...credentials.map(() => true),
    ],
  };
};

const demoSites = [
  [
    "https://no-id-example.identinet.io",
    "No DID document available",
    fetchDemoResult,
  ],
  [
    "https://id-well-known-example.identinet.io",
    "DID document available, no credentials",
    fetchDemoResult,
  ],
  [
    "https://id-plus-well-known-example.identinet.io",
    "DID document available, multiple credentials",
    fetchDemoResult,
  ],
  [
    "https://id-broken-plus-well-known-example.identinet.io",
    "DID document available, invalid credential",
    async (url) => {
      const result = await fetchDemoResult(url);
      return {
        ...result,
        results: [
          ...result.credentials.map(() => false),
        ],
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
  let input = formData.get("q") as string;

  try {
    const demoResult = await handleDemoUrl(input);
    if (demoResult) return demoResult;

    // TODO rework, for time being API expects https URLs
    if (input.indexOf("did:") != 0) {
      if (input.indexOf("http") != 0) {
        input = `https://${input}`;
      }
    }

    const response = await fetch(
      `https://${process.env.EXTERNAL_API_HOSTNAME}/v1/verification?q=${input}`,
    );

    if (response.status == 404) {
      return await response.json();
    }

    if (!response.ok) throw new Error(response.statusText);

    const result = await response.json();

    if (result.error) throw new Error(result.error);

    return result;
  } catch (error) {
    return error;
  }
}, "verifyUrl");

function ErrorMessage(props) {
  return (
    <p class="mt-2 text-sm text-red-600 dark:text-red-500">
      {props.error}
    </p>
  );
}

export default function VerificationSearch() {
  const verifyUrl = useAction(verifyUrlAction);
  const submission = useSubmission(verifyUrlAction);
  const [searchParams, setSearchParams] = useSearchParams();

  createEffect(() => {
    /*   initDropdowns(); */
    if (searchParams.q) {
      const formData = new FormData();
      formData.set("q", searchParams.q);
      search(formData);
    }
  });

  // deno-lint-ignore no-unused-vars
  const { validate, formSubmit, errors, resetErrors } = useForm({
    errorClass: "error-input",
  });
  const isValidInput = ({ value }) => {
    // prepend https:// if value does not begin with http or https
    // this allows us to parse the value as an URL
    if (value.indexOf("http") != 0) {
      value = `https://${value}`;
    }
    try {
      const url = new URL(value);
      return (url.protocol != "https:") && "Please enter an entire valid URL.";
    } catch (_e) {
      return "Please enter an entire valid URL.";
    }
  };
  const search = (formData) => {
    resetErrors();
    return verifyUrl(formData);
  };

  const submit = (form) => {
    const formData = new FormData(form);
    const q = formData.get("q") as string;
    if (searchParams.q !== q) {
      /* The change of q also triggers a search */
      setSearchParams({ q });
    } else {
      /* Prevent triggering two searches since it's already triggered whenever q changes */
      return search(formData);
    }
  };

  return (
    <>
      {/* <section class="flex items-center flex-col"> */}
      <section
        class="flex flex-col lg:grid gap-4"
        classList={{
          "columns-1": !(Boolean(submission.result) || submission.pending),
          'grid-cols-[20rem_minmax(0,1fr)] lg:[grid-template-areas:_"._search"_"aside_results"]':
            Boolean(submission.result) ||
            submission.pending,
        }}
      >
        <div
          class="[grid-area:_search] flex flex-col"
          classList={{
            "items-start": Boolean(submission.result) || submission.pending,
          }}
        >
          <div class="flex flex-col items-center max-lg:w-full">
            <form
              use:formSubmit={submit}
              class="max-w-md w-full mx-auto mb-2"
            >
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
                  id="verify-input"
                  type="search"
                  aria-label="search"
                  name="q"
                  class="block w-full p-2 pl-10 pr-20 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary-300 focus:border-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 disabled:bg-gray-200 dark:disabled:bg-gray-800"
                  disabled={submission.pending}
                  placeholder="www…"
                  value={searchParams.q || ""}
                  required
                  use:validate={[isValidInput]}
                />
                <button
                  type="submit"
                  disabled={submission.pending || errors.q}
                  class="absolute top-0 bottom-0 right-0 px-4 py-2 text-sm font-medium text-white rounded-r-lg bg-primary-300 focus:outline-none focus:ring-primary-300 dark:bg-primary-600  dark:focus:ring-primary-800"
                  classList={{
                    "hover:bg-primary-700": !submission.pending,
                    "dark:hover:bg-primary-700": !submission.pending,
                  }}
                >
                  Check{submission.pending ? "ing..." : ""}
                </button>
              </div>
              {errors.q && <ErrorMessage error={errors.q} />}
            </form>

            <span class="text-xs">
              Enter a web shop's URL or domain name to verify and inspect its
              identity.

              {/* Or pick an&nbsp; */}
              {/* <button */}
              {/*   id="dropdownHoverButton" */}
              {/*   data-dropdown-toggle="dropdownHover" */}
              {/*   data-dropdown-trigger="hover" */}
              {/*   class="focus:outline-none text-primary-500 text-xs" */}
              {/*   type="button" */}
              {/* > */}
              {/*   example site */}
              {/* </button> */}
              {/* . */}
            </span>

            {/* <div */}
            {/*   id="dropdownHover" */}
            {/*   class="z-10 hidden bg-gray-50 divide-y divide-gray-100 rounded-lg shadow-sm" */}
            {/* > */}
            {/*   <ul */}
            {/*     class="text-sm text-gray-700" */}
            {/*     aria-labelledby="dropdownHoverButton" */}
            {/*   > */}
            {/*     <For each={demoSites}> */}
            {/*       {[url, title] = ( */}
            {/*         <li> */}
            {/*           <a */}
            {/*             href={`/?q=${url}`} */}
            {/*             class="block p-1 hover:underline" */}
            {/*           > */}
            {/*             {title} */}
            {/*           </a> */}
            {/*         </li> */}
            {/*       )} */}
            {/*     </For> */}
            {/*   </ul> */}
            {/* </div> */}
          </div>
        </div>

        <Suspense
          fallback={
            <div class="[grid-area:_results]">
              Loading...
            </div>
          }
        >
          <ErrorBoundary
            fallback={(error) => (
              <div class="[grid-area:_results]">
                <ErrorCard
                  icon="i-flowbite-fire-outline"
                  message={`There was an error when checking the site: ${error.message}`}
                />
              </div>
            )}
          >
            <Show when={submission.result}>
              {(result) => <VerificationResult result={result()} />}
            </Show>
          </ErrorBoundary>
        </Suspense>
      </section>
    </>
  );
}
