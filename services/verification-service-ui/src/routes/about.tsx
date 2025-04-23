import { onMount } from "solid-js";
import { initAccordions } from "flowbite";

const data = [
  [
    "What is Check?",
    "CHECK is a specialized verification service designed to bring transparency and trust to e-commerce transactions.",
    "Funded by NGI Trustchain with backing from the European Government, CHECK helps buyers and merchants verify critical information about their counterparts, making high-value and cross-border transactions safer and more reliable.",
  ],
  [
    "How CHECK works",
    "Our service uses Decentralized Identifiers (DIDs) to create genuine trust in online shopping:",
    `<ol class="list-decimal list-inside">
          <li>
<span class="font-semibold">Self-Sovereign Digital IDs:</span> Merchants control their own digital identities instead of relying on centralized platforms.
</li>
<li>
<span class="font-semibold">Verified Credentials:</span> When you enter a shop's URL into CHECK, we locate the merchant's DID and verify their attached credentials (business registrations, certifications, performance history).
</li>
<li>
<span class="font-semibold">No Middleman Required:</span> Unlike traditional verification systems where companies control all data, DIDs allow direct verification without trusting intermediaries
</li>
        </ol>`,
    "What makes CHECK different is our decentralized approach - credentials are verified directly through the DID system, making verification more reliable, private, and fraud-resistant than centralized databases or review systems.",
  ],
  [
    "Why CHECK is different",
    "Unlike conventional review platforms that rely primarily on customer opinions, CHECK provides objective, credential-based verification of merchants. Here's what sets us apart:",
    `<ul class="list-disc list-inside">
<li>
<span class="font-semibold">Credential-Based Verification:</span> Instead of subjective reviews, we focus on verifiable credentials and factual information
</li>
<li>
<span class="font-semibold">European Government Backing:</span> Our service is backed by the NGI Trustchain initiative, ensuring high standards and regulatory compliance
</li>
<li>
<span class="font-semibold">Focus on Critical Transactions:</span> We specifically address high-value goods and cross-border digital purchases where trust is essential
</li>
<li>
<span class="font-semibold">Two-Way Verification:</span> Our system allows both merchants and buyers to verify each other, creating a balanced ecosystem of trust
</li>
</ul>
      `,
  ],
  [
    "When to use CHECK",
    "CHECK is particularly valuable when:",
    `<ul class="list-disc list-inside">
<li>
Purchasing high-value items from unfamiliar merchants
</li>
<li>
Buying digital goods from foreign jurisdictions
</li>
<li>
Establishing new business relationships
</li>
<li>
Verifying the legitimacy of online marketplaces
</li>
</ul>`,
  ],
  [
    "Our mission",
    "At CHECK, we believe that trust should be built on verifiable information, not just reputation. By providing objective merchant verification, we aim to make e-commerce safer and more accessible for everyone, regardless of where they're located or what they're purchasing.",
  ],
];

export default function About() {
  onMount(() => {
    initAccordions();
  });

  return (
    <main class="mx-auto w-lg p-4">
      <div
        id="accordion-open"
        data-accordion="open"
        data-active-classes="active"
      >
        <For each={data}>
          {([title, ...paragraphs], idx) => (
            <>
              <h2 id={`accordion-open-heading-${idx()}`} class="mt-8">
                <button
                  type="button"
                  class="flex items-center justify-between w-full p-5 font-semibold rtl:text-right bg-primary-200 focus:ring-0 focus:ring-gray-200 gap-3 text-gray-900"
                  data-accordion-target={`#accordion-open-body-${idx()}`}
                  aria-expanded="true"
                  aria-controls={`accordion-open-body-${idx()}`}
                >
                  {title}
                  <svg
                    data-accordion-icon
                    class="w-3 h-3 rotate-180 shrink-0"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5 5 1 1 5"
                    />
                  </svg>
                </button>
              </h2>
              <div
                id={`accordion-open-body-${idx()}`}
                class="hidden"
                aria-labelledby={`accordion-open-heading-${idx()}`}
              >
                <div class="text-gray-900 p-5">
                  <For each={paragraphs}>
                    {(paragraph) => (
                      <div class="mb-2" innerHTML={paragraph}></div>
                    )}
                  </For>
                </div>
              </div>
            </>
          )}
        </For>
      </div>
    </main>
  );
}
