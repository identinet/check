import { For } from "solid-js";
import { CredentialCard, ErrorCard, NotFoundCard } from "./CredentialCard";

export default function VerificationResult({ pending, result, error }) {
  if (pending) {
    return (
      <div class="max-w-md mx-auto mt-8">
        Pending…
      </div>
    );
  }

  if (error) {
    return (
      <div class="max-w-md mx-auto mt-8">
        <ErrorCard
          icon="i-flowbite-fire-outline"
          message={`There was an error when checking the site: ${error}`}
        />
      </div>
    );
  }

  const credentials = result.presentation?.verifiableCredential || [];
  const status = result.status;

  if (status == "NOT_FOUND") {
    return (
      <div class="max-w-md mx-auto mt-8">
        <NotFoundCard
          icon="i-flowbite-ban-outline"
          message="No identifier found."
        />
      </div>
    );
  }

  if (credentials.length == 0) {
    return (
      <div class="max-w-md mx-auto mt-8">
        <NotFoundCard
          icon="i-flowbite-ban-outline"
          message="There are no credentials available for this identifier."
        />
      </div>
    );
  }

  return (
    <>
      <div class="wfit mx-auto mt-8 text-sm font-medium text-center text-gray-900 border-b border-gray-200">
        <ul class="flex flex-wrap -mb-px">
          <li class="me-2">
            <a
              href="#"
              class="inline-block px-4 py-2 border-b-2 border-valid-900 rounded-t-lg active"
              aria-current="page"
            >
              All credentials
            </a>
          </li>
          <li class="me-2">
            <a
              href="#"
              class="inline-block px-4 py-2 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300"
            >
              About the retailer
            </a>
          </li>
          <li class="me-2">
            <a
              href="#"
              class="inline-block px-4 py-2 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300"
            >
              Return & Disputes
            </a>
          </li>
          <li class="me-2">
            <a
              href="#"
              class="inline-block px-4 py-2 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300"
            >
              History
            </a>
          </li>
        </ul>
      </div>
      <div class="flex justify-center mt-8">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <For each={credentials}>
            {(credential) => (
              <div class="flex">
                <CredentialCard status={status} credential={credential} />
              </div>
            )}
          </For>
        </div>
      </div>
    </>
  );
}
