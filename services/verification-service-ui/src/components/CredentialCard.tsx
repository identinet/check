import { Component, createSignal, For, JSX, Show } from "solid-js";

type Props = {
  icon: string;
  message: string;
} & JSX.HTMLAttributes<HTMLDivElement>;

export const NotFoundCard: Component<Props> = (props) => {
  return (
    <div
      class={`p-6 bg-gradient-linear border-2 rounded-md shadow-sm bg-gradient-from-gray-100 bg-gradient-via-gray-100 bg-gradient-to-gray-300 border-gray-500`}
    >
      {props.icon && (
        <div class="mb-4 flex items-center justify-center text-xl font-bold tracking-tight text-gray-900">
          <div class={`${props.icon} me-2 w-8 h-8 shrink-0`} />
        </div>
      )}
      {props.message &&
        (
          <div class="mb-3">
            {props.message}
          </div>
        )}
    </div>
  );
};

type PropsCard = {
  credential: object;
  verificationResult: object;
} & JSX.HTMLAttributes<HTMLDivElement>;

export function CredentialCard(props): Component<PropsCard> {
  const [collapsed, setCollapsed] = createSignal(true);
  const toggleCardView = () => setCollapsed((collapsed) => !collapsed);
  const resultElement = ({ error, errorDetails }) => (
    <>
      <div
        class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        classList={{
          "border-red-400": !props.verificationResult.verified,
        }}
      >
        <div class="items-start justify-between border-b border-gray-100 pb-4 dark:border-gray-700 md:flex">
          <div class="mb-4 justify-between sm:flex sm:items-center md:mb-0 md:block lg:mb-4 lg:flex xl:mb-0 xl:block">
            <div class="items-center gap-4 flex">
              <div
                class="size-14"
                classList={{
                  "i-flowbite-file-check-solid ":
                    props.verificationResult.verified,
                  "i-flowbite-file-solid ": !props.verificationResult.verified,
                  "text-gray-400": props.verificationResult.verified,
                  "dark:text-gray-700": props.verificationResult.verified,
                  "text-red-400": !props.verificationResult.verified,
                  "dark:text-red-700": !props.verificationResult.verified,
                }}
              />
              <div class="">
                <div class="mb-2 items-center sm:flex sm:space-x-2">
                  <a
                    href="#"
                    class="mb-2 block font-semibold text-gray-900 hover:underline dark:text-white sm:mb-0 sm:flex"
                  >
                    {titleFromCredentialType(props.credential)}
                  </a>
                  <span
                    class="inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium"
                    classList={{
                      "bg-green-100": props.verificationResult.verified,
                      "text-green-800": props.verificationResult.verified,
                      "dark:text-green-800": props.verificationResult.verified,
                      "bg-red-100": !props.verificationResult.verified,
                      "text-red-800": !props.verificationResult.verified,
                      "dark:text-red-800": !props.verificationResult.verified,
                    }}
                  >
                    <div
                      class="me-1 size-3"
                      classList={{
                        "i-flowbite-badge-check-solid":
                          props.verificationResult.verified,
                        "i-flowbite-close-circle-solid": !props
                          .verificationResult
                          .verified,
                      }}
                    />
                    {props.verificationResult.verified
                      ? "Verified"
                      : "Verification failed"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            data-drawer-target="extend-warranty-drawer"
            data-drawer-show="extend-warranty-drawer"
            data-drawer-placement="right"
            type="button"
            onClick={toggleCardView}
            class="w-full rounded-lg bg-primary-300 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none dark:bg-primary-600 dark:hover:bg-primary-300 md:w-auto"
          >
            {collapsed() ? "Show details" : "Hide details"}
          </button>
        </div>
        <Show
          when={!error}
          fallback={
            <div class="p-2">
              <div class="font-bold">{error}</div>
              {!collapsed() && errorDetails && (
                <div class="text-sm">{errorDetails}</div>
              )}
            </div>
          }
        >
          <div class="md:columns-2 p-2">
            {credentialDetails(props.credential)}
          </div>
        </Show>
      </div>
    </>
  );

  const credentialDetails = (credential) => {
    return (
      <>
        {renderClaim([
          "Issuer",
          credential.issuer,
          `/?q=${encodeURIComponent(credential.issuer)}`,
        ])}
        {renderClaim(["Issuance date", credential.issuanceDate])}
        <Show when={!collapsed()}>
          {renderClaim([null, credential.credentialSubject])}
        </Show>
      </>
    );
  };

  if (!props.verificationResult.verified) {
    return resultElement({
      error: props.verificationResult.message,
      errorDetails: props.verificationResult.details,
    });
  }

  // VERIFED
  return resultElement({});
}

const isObject = (item) => {
  return (typeof item === "object" && !Array.isArray(item) && item !== null);
};

const titleFromCredentialType = (credential) => {
  let types = Array.isArray(credential.type)
    ? credential.type
    : [credential.type];

  // if there is more than one item remove the "VerifiableCredential" item
  if (types.length > 1) {
    const idx = types.indexOf("VerifiableCredential");
    if (idx >= 0) types.splice(idx, 1);
  }

  // remove "schema:" parts from types
  types = types.map((t) => {
    const parts = t.split(":");
    return parts[parts.length - 1];
  });

  return types.join(" ");
};

const formatClaimKey = (key) => {
  const newKey = key.replace("schema:", "");
  return newKey.charAt(0).toUpperCase() + newKey.slice(1);
};

const formatClaimValue = (value) => {
  // return  numbers as numbers (else they would get parsed as Dates)
  const num = Number(value);
  if (!isNaN(num)) return num;

  // format dates
  const ts = Date.parse(value);
  if (isNaN(ts)) return value; // timestring could not be parsed

  const date = new Date(ts);
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).format(date);
};

const renderClaim = ([key, value, url]) => {
  if (!isObject(value)) {
    return (
      <dl class="p-2 flex items-center text-gray-500 dark:text-gray-400">
        <dt class="me-2 font-medium text-gray-900 dark:text-white">
          {formatClaimKey(key)}
        </dt>
        <dd>
          <Show when={url} fallback={formatClaimValue(value)}>
            <a
              href={url}
              class="underline"
            >
              {formatClaimValue(value)}
            </a>
          </Show>
        </dd>
      </dl>
    );
  }
  return (
    <For each={Object.entries(value)}>
      {([key, value]) => renderClaim([key, value])}
    </For>
  );
};
