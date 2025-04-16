import { createSignal, For } from "solid-js";

const classesInvalid =
  "bg-gradient-from-invalid-100 bg-gradient-via-invalid-100 bg-gradient-to-invalid-500 border-invalid-900";
const classesValid =
  "bg-gradient-from-valid-100 bg-gradient-via-valid-100 bg-gradient-to-valid-500 border-valid-900";
const classesRisky =
  "bg-gradient-from-risky-100 bg-gradient-via-risky-100 bg-gradient-to-risky-500 border-risky-900";

export function ErrorCard({ icon, message }) {
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

export function CredentialCard({ credential, status }) {
  const [collapsed, setCollapsed] = createSignal(true);
  const toggleCardView = () => setCollapsed((collapsed) => !collapsed);

  const resultElement = ({ title, details, classes, icon, desc }) => {
    return (
      <div
        class={`max-w-sm p-6 bg-gradient-linear border-2 rounded-md shadow-sm ${classes}`}
      >
        {(icon || desc) && (
          <div class="mb-4 flex items-center justify-center text-xl font-bold tracking-tight text-gray-900">
            {icon && <div class={`${icon} me-2 w-4 h-4 shrink-0`} />}
            {desc && <span>{desc}</span>}
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
        >
          {collapsed() && "View full credential"}
          {!collapsed() && "Return to preview"}
        </button>
      </div>
    );
  };

  const credentialDetails = (credential) => {
    return (
      <dl class="text-sm text-left rtl:text-right w-full">
        <div class="preview grid grid-cols-[1fr_2fr] gap-4 mb-4">
          {renderClaim(["Issuer", credential.issuer])}
          {renderClaim(["Issued", credential.issuanceDate])}
        </div>
        <div
          class={`full grid grid-cols-[1fr_2fr] gap-4 ${
            collapsed() ? "hidden" : ""
          }`}
        >
          {renderClaim([null, credential.credentialSubject])}
        </div>
      </dl>
    );
  };

  if (status == "NOT_VERIFIED") {
    return resultElement({
      icon: "i-flowbite-close-circle-solid",
      desc: "Invalid",
      classes: classesInvalid,
      title: titleFromCredentialType(credential),
      details: credentialDetails(credential),
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
  if (Array.isArray(credential.type)) {
    return credential.type.join(" ");
  }

  return credential.type;
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
        <dt class="font-semibold">{formatClaimKey(key)}</dt>
        <dd>{formatClaimValue(value)}</dd>
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
