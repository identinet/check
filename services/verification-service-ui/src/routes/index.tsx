import icon from "~/assets/logo-shield.svg";
import { useLocation, useSearchParams } from "@solidjs/router";
import VerificationSearch from "~/components/VerificationSearch";

export default function Home() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const showOnlyOnMain = () =>
    location.search.indexOf("q=") < 0 ? "flex" : "hidden";

  return (
    <main
      class="text-center mx-auto text-gray-700 p-4"
      classList={{
        [searchParams.q === undefined ? "mt-15vh" : "mt-8"]: true,
      }}
    >
      <div
        class="flex-col justify-center items-center mb-12"
        classList={{
          [searchParams.q === undefined ? "flex" : "hidden"]: true,
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
          Helping retailers and clients transact with confidence
        </p>
      </div>
      <VerificationSearch />
    </main>
  );
}
