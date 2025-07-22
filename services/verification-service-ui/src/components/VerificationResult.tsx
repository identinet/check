import { Component, createSignal, For, JSX } from "solid-js";
import { CredentialCard, ErrorCard, NotFoundCard } from "./CredentialCard";

const categoryTemplates = [
  { id: "all", name: "All credentials", active: true }, // following code expects "all" to be at index 0
  {
    id: "about_the_organization",
    name: "About the organization",
    types: [
      "schema:Organization",
    ],
    active: false,
  },
  {
    id: "about_the_retailer",
    name: "About the retailer",
    types: [
      "schema:OnlineStore",
    ],
    active: false,
  },
  {
    id: "return_and_disputes",
    name: "Return & Disputes",
    types: [
      "schema:MerchantReturnPolicy",
    ],
    active: false,
  },
  {
    id: "awards", // if the attribute award is present
    name: "Awards",
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
  pending: boolean;
  result: object;
  error: Error;
} & JSX.HTMLAttributes<HTMLDivElement>;

export default function VerificationResult(
  { pending, result, error },
): Component<Props> {
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
          message={`There was an error when checking the site: ${error.message}`}
        />
      </div>
    );
  }

  const credentials = result.credentials || [];
  const results = result.results || [];

  if (credentials.length == 0) {
    return (
      <div class="max-w-md mx-auto mt-8">
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
      <div class="wfit mx-auto mt-8 text-sm font-medium text-center text-gray-900 border-b border-gray-200">
        <ul class="flex flex-wrap">
          <For each={allCategories()}>
            {(category, _idx) => {
              // do not display categories with no credentials
              if (category.vcs.length == 0) return;
              return (
                <li class="me-2">
                  <a
                    href="#"
                    onclick={() => selectCategory(category.id)}
                    class="inline-block px-4 py-2 border-b-2 rounded-t-lg"
                    classList={{
                      "border-valid-900": category.active,
                      "active": category.active,
                      "border-transparent": !category.active,
                      "hover:text-gray-600": !category.active,
                      "hover:border-gray-300": !category.active,
                    }}
                    aria-current="page"
                  >
                    {category.name}
                  </a>
                </li>
              );
            }}
          </For>
        </ul>
      </div>
      <div class="flex justify-center mt-8 gap-4 flex-wrap">
        <For each={currentCategory().vcs}>
          {(credential, idx) => (
            <div class="h-fit w-96">
              <CredentialCard
                verificationResult={results[idx()]}
                credential={credential}
              />
            </div>
          )}
        </For>
      </div>
    </>
  );
}
