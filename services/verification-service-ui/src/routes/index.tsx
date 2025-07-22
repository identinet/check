import icon from "~/assets/logo-shield.svg";
import { useSearchParams } from "@solidjs/router";
import VerificationSearch from "~/components/VerificationSearch.tsx";

export default function Index() {
  const [searchParams] = useSearchParams();

  return (
    <main
      class="container grow mx-auto text-gray-700 p-4"
      classList={{
        "mt-15vh": !searchParams.q,
      }}
    >
      <div
        class="flex-col justify-center items-center mb-12"
        classList={{
          [!searchParams.q ? "flex" : "hidden"]: true,
        }}
      >
        <img
          src={icon}
          class="w-20 h-20"
          alt="check logo shield"
        />
        <h2 class="uppercase text-4xl md-text-5xl font-bold mt-12 mb-2">
          Check
        </h2>
        <p class="text-lg md-text-xl">
          Securing E-commerce with Verifiable Data about Merchants
        </p>
      </div>
      <VerificationSearch />
    </main>
  );
}
