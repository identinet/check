import { For } from "solid-js";
import { CredentialCard, ErrorCard, NotFoundCard } from "./CredentialCard";

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

  const categories = [
    { id: "all", name: "All credentials", vcs: [] }, // following code expects "all" to be at index 0
    {
      id: "about_the_organization",
      name: "About the organization",
      types: [
        "schema:Organization",
      ],
      vcs: [],
    },
    {
      id: "about_the_retailer",
      name: "About the retailer",
      types: [
        "schema:OnlineStore",
      ],
      vcs: [],
    },
    {
      id: "return_and_disputes",
      name: "Return & Disputes",
      types: [
        "schema:MerchantReturnPolicy",
      ],
      vcs: [],
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
      vcs: [],
    },
    { id: "misc", name: "Miscellaneous", vcs: [] }, // following code expects "misc" to be at last index
  ];

  for (let i = 0; i < credentials.length; i++) {
    const credential = credentials[i];
    let assigned = false;
    for (let j = 0; j < categories.length; j++) {
      let intersection = categories[j].types?.filter((typ) =>
        credential.type.includes(typ)
      );

      // only add schema:Service credentials to awards category if "award" attribute is present
      if (
        categories[j].id == "awards" &&
        intersection.includes("schema:Service") &&
        !credential.credentialSubject.hasOwnProperty("award")
      ) {
        // TODO: resetting the whole intersection array might be a bit brutal
        // better only remove the "schema:Service" item
        intersection = [];
      }

      if (intersection && intersection.length > 0) {
        categories[j].vcs.push(credential);
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

  return (
    <>
      <div class="wfit mx-auto mt-8 text-sm font-medium text-center text-gray-900 border-b border-gray-200">
        <ul class="flex flex-wrap -mb-px">
          <For each={categories}>
            {(category, idx) => {
              // do not display categories with no credentials
              if (category.vcs.length == 0) return;

              const classes = idx() == 0
                ? "border-valid-900 active"
                : "border-transparent hover:text-gray-600 hover:border-gray-300";
              return (
                <li class="me-2">
                  <a
                    href="#"
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
          <For each={credentials}>
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
