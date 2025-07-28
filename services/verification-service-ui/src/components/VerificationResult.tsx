import { Component, createSignal, For, JSX } from "solid-js";
import { CredentialCard, NotFoundCard } from "./CredentialCard.tsx";

const iconClasses =
  "text-gray-400 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white size-6 max-lg:size-7";
const categoryTemplates = [
  {
    id: "all",
    name: "All Credentials",
    icon: <div class={`i-flowbite-file-check-solid ${iconClasses}`} />,
    active: true,
  }, // following code expects "all" to be at index 0
  {
    id: "about_the_organization",
    name: "Organization",
    icon: <div class={`i-flowbite-building-outline ${iconClasses}`} />,
    types: [
      "schema:Organization",
    ],
    active: false,
  },
  {
    id: "about_the_retailer",
    name: "E-commerce",
    icon: <div class={`i-flowbite-shopping-bag-outline ${iconClasses}`} />,
    types: [
      "schema:OnlineStore",
    ],
    active: false,
  },
  {
    id: "return_and_disputes",
    name: "Returns & Disputes",
    icon: <div class={`i-flowbite-truck-outline ${iconClasses}`} />,
    types: [
      "schema:MerchantReturnPolicy",
    ],
    active: false,
  },
  {
    id: "awards", // if the attribute award is present
    name: "Awards",
    icon: <div class={`i-flowbite-award-outline ${iconClasses}`} />,
    types: [
      "schema:CreativeWork",
      "schema:Organization",
      "schema:Person",
      "schema:Product",
      "schema:Service",
    ],
    active: false,
  },
  { id: "misc", name: "Miscellaneous", active: false }, // following code expects "misc" to be at last index
];

const assignCredentialsToCategories = (credentials: Array<object>) => {
  const categories = [];

  for (let j = 0; j < categoryTemplates.length; j++) {
    const category = { ...categoryTemplates[j], vcs: [] };
    delete category.types;
    categories.push(category);
  }

  for (let i = 0; i < credentials.length; i++) {
    const credential = credentials[i];
    let assigned = false;
    for (let j = 0; j < categoryTemplates.length; j++) {
      const category = categories[j];

      let intersection = categoryTemplates[j].types?.filter((t) =>
        credential.type.includes(t)
      );

      // only add credentials to awards category if "award" attribute is present
      if (
        category.id == "awards" &&
        !("award" in (credential.credentialSubject || {}) ||
          "schema:award" in (credential.credentialSubject || {}))
      ) {
        intersection = [];
      }

      if (intersection && intersection.length > 0) {
        category.vcs.push(credential);
        assigned = true;
      }
    }

    // add credential to "all" category
    categories[0].vcs.push(credential);

    // add credential to "misc" category if it has not been assigned to a category, yet
    if (!assigned) {
      categories[categories.length - 1].vcs.push(credential);
    }
  }

  return categories;
};

type Props = {
  result: object;
  error: Error;
} & JSX.HTMLAttributes<HTMLDivElement>;

export default function VerificationResult(props): Component<Props> {
  const credentials = props.result.credentials || [];
  const results = props.result.results || [];

  if (credentials.length == 0) {
    return (
      <>
        <div class="[grid-area:_results]">
          <NotFoundCard
            icon="i-flowbite-ban-outline"
            message="Unfortunately, there is no entry for this shop."
          />
        </div>
      </>
    );
  }

  const categories = assignCredentialsToCategories(credentials);

  const [allCategories, setAllCategories] = createSignal(categories);
  const [currentCategory, setCurrentCategory] = createSignal(categories[0]);

  const selectCategory = (catId) => {
    setCurrentCategory(
      allCategories().find((category) => category.id === catId),
    );
    setAllCategories(
      allCategories().map((category) =>
        category.id !== catId
          ? { ...category, active: false }
          : { ...category, active: true }
      ),
    );
  };

  return (
    <>
      {/* <!-- Sidenav --> */}
      <aside
        id="sidebar"
        name="sidebar"
        class="[grid-area:_aside] self-start lg:w-80 shrink-0 overflow-y-auto border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800 rounded-lg"
      >
        <div class="mb-3 flex w-full items-center justify-between rounded-lg bg-white p-2 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:bg-gray-800 dark:focus:ring-gray-700">
          <div class="flex w-full items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div class="i-flowbite-fingerprint-solid size-12 duration-75 text-primary-400" />
              </div>
              <div class="text-left">
                <h2 class="mb-0.5 font-semibold leading-none text-gray-900 dark:text-white">
                  Identity Profile
                </h2>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {props.result.documents[0].id}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Buttons under profile */}
        <div class="hidden mb-4 w-full border-y border-gray-100 py-4 dark:border-gray-700">
          <ul class="grid grid-cols-3 gap-2">
            <li>
              <a
                href="#"
                class="group flex flex-col items-center justify-center rounded-xl bg-primary-50 p-2.5 hover:bg-primary-100 dark:bg-primary-900 dark:hover:bg-primary-800"
              >
                <span class="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 group-hover:bg-primary-200 dark:bg-primary-800  dark:group-hover:bg-primary-700">
                  <svg
                    class="h-5 w-5 text-primary-600 dark:text-primary-300"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="square"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 19H5a1 1 0 0 1-1-1v-1a3 3 0 0 1 3-3h2m10 1a3 3 0 0 1-3 3m3-3a3 3 0 0 0-3-3m3 3h1m-4 3a3 3 0 0 1-3-3m3 3v1m-3-4a3 3 0 0 1 3-3m-3 3h-1m4-3v-1m-2.121 1.879-.707-.707m5.656 5.656-.707-.707m-4.242 0-.707.707m5.656-5.656-.707.707M12 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                </span>
                <span class="text-sm font-medium text-primary-600 dark:text-primary-300">
                  Profile
                </span>
              </a>
            </li>
            <li>
              <a
                href="#"
                class="group flex flex-col items-center justify-center rounded-xl bg-purple-50 p-2.5 hover:bg-purple-100 dark:bg-purple-900 dark:hover:bg-purple-800"
              >
                <span class="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 group-hover:bg-purple-200 dark:bg-purple-800  dark:group-hover:bg-purple-700">
                  <svg
                    class="h-5 w-5 text-purple-600 dark:text-purple-300"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 21v-9m3-4H7.5a2.5 2.5 0 1 1 0-5c1.5 0 2.875 1.25 3.875 2.5M14 21v-9m-9 0h14v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8ZM4 8h16a1 1 0 0 1 1 1v3H3V9a1 1 0 0 1 1-1Zm12.155-5c-3 0-5.5 5-5.5 5h5.5a2.5 2.5 0 0 0 0-5Z"
                    />
                  </svg>
                </span>
                <span class="text-sm font-medium text-purple-600 dark:text-purple-300">
                  Gifts
                </span>
              </a>
            </li>
            <li>
              <a
                href="#"
                class="group flex flex-col items-center justify-center rounded-xl bg-teal-50 p-2.5 hover:bg-teal-100 dark:bg-teal-900 dark:hover:bg-teal-800"
              >
                <span class="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 group-hover:bg-teal-200 dark:bg-teal-800  dark:group-hover:bg-teal-700">
                  <svg
                    class="h-5 w-5 text-teal-600 dark:text-teal-300"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 8H5m12 0a1 1 0 0 1 1 1v2.6M17 8l-4-4M5 8a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.6M5 8l4-4 4 4m6 4h-4a2 2 0 1 0 0 4h4a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1Z"
                    />
                  </svg>
                </span>
                <span class="text-sm font-medium text-teal-600 dark:text-teal-300">
                  Wallet
                </span>
              </a>
            </li>
          </ul>
        </div>
        {/* Categories */}
        <ul class="border-t border-gray-100 py-4 dark:border-gray-700 max-lg:flex flex-row">
          <For each={allCategories()}>
            {(category) => {
              if (category.vcs.length == 0) return;
              return (
                <li
                  class="group flex cursor-pointer items-center rounded-lg p-2 text-base font-medium text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  href="#"
                  onclick={() => selectCategory(category.id)}
                  classList={{
                    "active": category.active,
                    "bg-gray-100": category.active,
                    "dark:bg-gray-700": category.active,
                  }}
                >
                  {category.icon}
                  <a
                    href="#"
                    onclick={() => selectCategory(category.id)}
                    aria-current="page"
                    class="ml-3 hidden lg:inline"
                  >
                    {category.name}
                  </a>
                </li>
              );
            }}
          </For>
        </ul>
      </aside>
      {/* <!-- Right content --> */}
      <div class="w-full [grid-area:_results]">
        {/* <!-- Credentials --> */}
        <For each={currentCategory().vcs}>
          {(credential, idx) => (
            <CredentialCard
              verificationResult={results[idx()]}
              credential={credential}
            />
          )}
        </For>
      </div>
    </>
  );
}
