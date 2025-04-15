import { createSignal, For } from "solid-js";
import { CredentialCard, ErrorCard } from "./CredentialCard";

export default function VerificationResult({ pending, result, error }) {
  if (pending) {
    return "pending...";
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

  if (credentials.length == 0) {
    return (
      <div class="max-w-md mx-auto mt-8">
        <ErrorCard
          icon="i-flowbite-ban-outline"
          message="Unfortunately, there are no credentials available for this site."
        />
      </div>
    );
  }

  return (
    <div class="flex justify-center mt-4">
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <For each={credentials}>
          {(credential) => (
            <CredentialCard status={status} credential={credential} />
          )}
        </For>
      </div>
    </div>
  );
}
