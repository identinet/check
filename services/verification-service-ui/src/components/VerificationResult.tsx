import { For, Show } from "solid-js";
import { action, query, useAction, useSubmission } from "@solidjs/router";
import { useForm } from "~/utils/forms/validation";
import {
  VerificationResultDetailNotVerified,
  VerificationResultDetailSuccess,
} from "./VerificationResultDetailDummies";

const greyClasses = "bg-gray-50 border-gray-300 dark:border-gray-600";
const greenClasses =
  "bg-green-50 border-green-300 dark:border-green-800 dark:text-green-400 text-black-400";
const yellowClasses =
  "bg-yellow-50 border-yellow-300 dark:border-yellow-800 dark:text-yellow-300 text-yellow-800";
const redClasses =
  "bg-red-50 border-red-300 dark:border-red-800 dark:text-red-400 text-red-800";

const resultElement = ({ classes, title, desc, details }) => {
  const commonClasses =
    "text-left border dark:bg-gray-800 mb-4 p-4 rounded-lg max-w-md mt-8 mx-auto";

  return (
    <div class={`${commonClasses} ${classes}`} role="alert">
      <h3 class="text-lg text-center font-medium">{title}</h3>
      {desc &&
        <div class="mt-2 mb-4 text-sm">{desc}</div>}
      {details &&
        <div class="mt-2 mb-4">{details}</div>}
    </div>
  );
};

const errorElement = ({ error }) => {
  const msg = error.message ? error.message : "Unknown error";
  return resultElement({
    classes: yellowClasses,
    icon: "i-flowbite-fire-solid",
    title: "Error",
    desc: `There was an error while verifying the address: ${msg}.`,
  });
};

export default function VerificationResult({ pending, result, error }) {
  /* console.log("VerificationResult", result); */
  if (pending) {
    return resultElement({
      classes: greyClasses,
      icon: "i-flowbite-cog-outline",
      title: "Pending...",
    });
  }

  if (error) {
    return errorElement({ error });
  }

  if (result.status == "NOT_VERIFIED") {
    return resultElement({
      classes: redClasses,
      icon: "i-flowbite-exclamation-circle-solid",
      title: "Not verified",
      desc: "Uh oh! This address could not be verified.",
      details: VerificationResultDetailNotVerified,
    });
  }

  if (result.status == "NO_CREDENTIAL") {
    return resultElement({
      classes: greenClasses,
      icon: "i-flowbite-badge-check-solid",
      title: "Success",
      desc: "Address verified successfully!",
      details: VerificationResultDetailSuccess(false),
    });
  }

  const credential = result.presentation.verifiableCredential[0];

  // VERIFED, CREDENTIALS
  return resultElement({
    classes: greenClasses,
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
      <tr class="dark:border-gray-700 border-gray-200">
        <th
          scope="row"
          class="pr-6 py-2 font-semibold text-black-900 whitespace-nowrap dark:text-white"
        >
          {formatClaimKey(key)}
        </th>
        <td class="pl-6 py-2">{formatClaimValue(value)}</td>
      </tr>
    );
  }

  return (
    <For each={Object.entries(value)}>
      {([key, value], index) => {
        return renderClaim([key, value]);
      }}
    </For>
  );
};

const credentialDetails = (credential) => {
  return (
    <div class="text-left">
      <table class="w-full text-sm text-left rtl:text-right">
        <tbody>
          {renderClaim(["Issuer", credential.issuer])}
          {renderClaim(["Issued", credential.issuanceDate])}
          {renderClaim([null, credential.credentialSubject])}
        </tbody>
      </table>
    </div>
  );
};
