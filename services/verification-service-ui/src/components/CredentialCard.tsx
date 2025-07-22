import { Component, createSignal, For, JSX } from "solid-js";

const classesInvalid =
  "bg-gradient-from-invalid-100 bg-gradient-via-invalid-100 bg-gradient-to-invalid-500 border-invalid-900";
const classesValid =
  "bg-gradient-from-valid-100 bg-gradient-via-valid-100 bg-gradient-to-valid-500 border-valid-900";
const classesGray =
  "bg-gradient-from-gray-100 bg-gradient-via-gray-100 bg-gradient-to-gray-300 border-gray-500";
//const classesRisky =
//  "bg-gradient-from-risky-100 bg-gradient-via-risky-100 bg-gradient-to-risky-500 border-risky-900";

type Props = {
  icon: string;
  message: string;
} & JSX.HTMLAttributes<HTMLDivElement>;

export const NotFoundCard: Component<Props> = ({ icon, message }) => {
  return (
    <div
      class={`p-6 bg-gradient-linear border-2 rounded-md shadow-sm ${classesGray}`}
    >
      {icon && (
        <div class="mb-4 flex items-center justify-center text-xl font-bold tracking-tight text-gray-900">
          <div class={`${icon} me-2 w-8 h-8 shrink-0`} />
        </div>
      )}
      {message &&
        (
          <div class="mb-3">
            {message}
          </div>
        )}
    </div>
  );
};

export function ErrorCard({ icon, message }): Component<Props> {
  return (
    <div
      class={`p-6 bg-gradient-linear border-2 rounded-md shadow-sm ${classesInvalid}`}
    >
      {icon && (
        <div class="mb-4 flex items-center justify-center text-xl font-bold tracking-tight text-gray-900">
          <div class={`${icon} me-2 w-8 h-8 shrink-0`} />
        </div>
      )}
      {message &&
        (
          <div class="mb-3">
            {message}
          </div>
        )}
    </div>
  );
}

type PropsCard = {
  credential: object;
  verificationResult: object;
} & JSX.HTMLAttributes<HTMLDivElement>;

export function CredentialCard(
  { credential, verificationResult },
): Component<PropsCard> {
  const [collapsed, setCollapsed] = createSignal(true);
  const toggleCardView = () => setCollapsed((collapsed) => !collapsed);

  const resultElement = (
    { title, details, classes, icon, desc, error, errorDetails },
  ) => {
    return (
      <div
        class={`flex-1 max-w-sm p-6 bg-gradient-linear border-2 rounded-md shadow-sm height-100% ${classes}`}
      >
        {(icon || desc) && (
          <div class="mb-4 flex items-center justify-center text-xl font-bold tracking-tight text-gray-900">
            {icon && <div class={`${icon} me-2 w-4 h-4 shrink-0`} />}
            {desc && <span>{desc}</span>}
          </div>
        )}
        {(error || errorDetails) && (
          <div class="mb-4 text-sm tracking-tight text-gray-900">
            {error && (
              <span class="font-bold">
                {error}
                <br />
              </span>
            )}
            {errorDetails && <span class="text-xs">{errorDetails}</span>}
          </div>
        )}
        <h5 class="mb-4 text-left text-xl font-bold tracking-tight text-gray-900">
          {title}
        </h5>
        {details && (
          <div class="mb-3">
            {details}
          </div>
        )}
        <button
          onClick={toggleCardView}
          class="text-xs text-gray-900 underline"
          type="button"
        >
          {collapsed() && "View full credential"}
          {!collapsed() && "Close"}
        </button>
      </div>
    );
  };

  const credentialDetails = (credential) => {
    return (
      <dl class="text-sm text-left rtl:text-right w-full">
        <div class="preview grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 mb-4">
          {renderClaim(["Issuer", credential.issuer])}
          {renderClaim(["Issued", credential.issuanceDate])}
        </div>
        <div
          class={`full grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 ${
            collapsed() ? "hidden" : ""
          }`}
        >
          {renderClaim([null, credential.credentialSubject])}
        </div>
      </dl>
    );
  };

  if (!verificationResult.verified) {
    return resultElement({
      icon: "i-flowbite-close-circle-solid",
      desc: "Invalid",
      classes: classesInvalid,
      title: titleFromCredentialType(credential),
      details: credentialDetails(credential),
      error: verificationResult.message,
      errorDetails: verificationResult.details,
    });
  }

  // VERIFED
  return resultElement({
    title: titleFromCredentialType(credential),
    details: credentialDetails(credential),
    classes: classesValid,
  });
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

const renderClaim = ([key, value]) => {
  if (!isObject(value)) {
    return (
      <>
        <dt class="font-semibold overflow-hidden text-ellipsis">
          {formatClaimKey(key)}
        </dt>
        <dd class="break-words">{formatClaimValue(value)}</dd>
      </>
    );
  }

  return (
    <For each={Object.entries(value)}>
      {([key, value]) => {
        return renderClaim([key, value]);
      }}
    </For>
  );
};
