import { createSignal, For } from "solid-js";
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
    id: "awards",
    name: "Awards",
    types: [
      "schema:CreativeWork",
      "schema:Organization",
      "schema:Person",
      "schema:Product",
      "schema:Service", // if the attribute award is present
    ],
    active: false,
  },
  { id: "misc", name: "Miscellaneous", active: false }, // following code expects "misc" to be at last index
];

const assignCredentialsToCategories = (credentials) => {
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

      let intersection = categoryTemplates[j].types?.filter((typ) =>
        credential.type.includes(typ)
      );

      // only add schema:Service credentials to awards category if "award" attribute is present
      if (
        category.id == "awards" &&
        intersection?.includes("schema:Service") &&
        !credential.credentialSubject.hasOwnProperty("award")
      ) {
        // TODO: resetting the whole intersection array might be a bit brutal
        // better only remove the "schema:Service" item
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

export default function VerificationResult({ pending, result, error }) {
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
          message={`There was an error when checking the site: ${error}`}
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
        <ul class="flex flex-wrap -mb-px">
          <For each={allCategories()}>
            {(category, idx) => {
              // do not display categories with no credentials
              if (category.vcs.length == 0) return;

              const classes = category.active
                ? "border-valid-900 active"
                : "border-transparent hover:text-gray-600 hover:border-gray-300";
              return (
                <li class="me-2">
                  <a
                    href="#"
                    onclick={() => selectCategory(category.id)}
                    class={`inline-block px-4 py-2 border-b-2 rounded-t-lg ${classes}`}
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
      <div class="flex justify-center mt-8">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <For each={currentCategory().vcs}>
            {(credential, idx) => (
              <div class="flex h-fit">
                <CredentialCard
                  verified={results[idx()]}
                  credential={credential}
                />
              </div>
            )}
          </For>
        </div>
      </div>
    </>
  );
}
