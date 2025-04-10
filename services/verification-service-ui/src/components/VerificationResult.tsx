import { createSignal, For } from "solid-js";
import {
  VerificationResultDetailNotVerified,
  VerificationResultDetailSuccess,
} from "./VerificationResultDetailDummies";

const errorElement = ({ error }) => {
  const msg = error.message ? error.message : "Unknown error";
  return resultElement({
    title: "Error",
    details: `There was an error while verifying the address: ${msg}.`,
  });
};

export default function VerificationResult({ pending, result, error }) {
  const [collapsed, setCollapsed] = createSignal(true);
  const toggleCardView = () => setCollapsed((collapsed) => !collapsed);

  const resultElement = ({ title, details }) => {
    return (
      <div class="max-w-sm p-6 bg-white border border-blue rounded-lg shadow-sm">
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

  /* console.log("VerificationResult", result); */
  if (pending) {
    return resultElement({
      title: "Pending...",
    });
  }

  if (error) {
    return errorElement({ error });
  }

  if (result.status == "NOT_VERIFIED") {
    return resultElement({
      title: "Not verified",
      details: VerificationResultDetailNotVerified,
    });
  }

  if (result.status == "NO_CREDENTIAL") {
    return resultElement({
      title: "Success",
      details: VerificationResultDetailSuccess(false),
    });
  }

  const credential = result.presentation.verifiableCredential[0];

  // VERIFED, CREDENTIALS
  return resultElement({
    title: titleFromCredentialType(credential),
    details: credentialDetails(credential),
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
