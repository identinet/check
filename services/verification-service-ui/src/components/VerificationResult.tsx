import { Show } from "solid-js";
import { action, query, useAction, useSubmission } from "@solidjs/router";
import { useForm } from "~/utils/forms/validation";
import {
  VerificationResultDetailNotVerified,
  VerificationResultDetailSuccess,
} from "./VerificationResultDetailDummies";

const greyClasses = "bg-gray-50 border-gray-300 dark:border-gray-600";
const greenClasses =
  "bg-green-50 border-green-300 dark:border-green-800 dark:text-green-400 text-green-800";
const yellowClasses =
  "bg-yellow-50 border-yellow-300 dark:border-yellow-800 dark:text-yellow-300 text-yellow-800";
const redClasses =
  "bg-red-50 border-red-300 dark:border-red-800 dark:text-red-400 text-red-800";

const resultElement = ({ classes, icon, title, desc, details }) => {
  const commonClasses =
    "text-left border dark:bg-gray-800 mb-4 p-4 rounded-lg max-w-md mt-8 mx-auto";

  return (
    <div class={`${commonClasses} ${classes}`} role="alert">
      <div class="flex items-center">
        <div class={`${icon} me-2 w-4 h-4 shrink-0`} />
        <span class="sr-only">Info</span>
        <h3 class="text-lg font-medium">{title}</h3>
      </div>
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

  // VERIFED, NO_CREDENTIAL
  return resultElement({
    classes: greenClasses,
    icon: "i-flowbite-badge-check-solid",
    title: "Success",
    desc: "Address verified successfully!",
    details: VerificationResultDetailSuccess,
  });
}
