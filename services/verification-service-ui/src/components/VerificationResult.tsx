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

  for (const categoryTemplate of categoryTemplates) {
    const category = { ...categoryTemplate, vcs: [] };
    categories.push(category);
  }

  for (const credential of credentials) {
    let assigned = false;
    for (const category of categories) {
      let intersection = category.types?.filter((t) =>
        credential.type?.includes(t)
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
      <div class="[grid-area:_results]">
        <NotFoundCard
          icon="i-flowbite-ban-outline"
          message="Unfortunately, there is no entry for this shop."
        />
      </div>
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
        {/* Categories */}
        <ul class="border-t border-gray-100 py-4 dark:border-gray-700 max-lg:flex flex-row">
          <For each={allCategories()}>
            {(category) => {
              if (category.vcs.length == 0) return;
              return (
                <li
                  class="group flex cursor-pointer items-center rounded-lg p-2 text-base font-medium text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  role="button"
                  onclick={() => selectCategory(category.id)}
                  onkeydown={() => selectCategory(category.id)}
                  classList={{
                    "active": category.active,
                    "bg-gray-100": category.active,
                    "dark:bg-gray-700": category.active,
                  }}
                >
                  {category.icon}
                  <button
                    onclick={() => selectCategory(category.id)}
                    aria-current="page"
                    class="ml-3 hidden lg:inline"
                  >
                    {category.name}
                  </button>
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
