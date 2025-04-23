import { useLocation } from "@solidjs/router";
import VerificationSearch from "~/components/VerificationSearch";

export default function Home() {
  const location = useLocation();
  const showOnlyOnMain = () =>
    location.search.indexOf("url=") < 0 ? "flex" : "hidden";

  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <div
        class={`flex-col justify-center items-center mt-6 mb-10 ${showOnlyOnMain()}`}
      >
        <img
          src="/logo-shield.svg"
          class="w-20 h-20"
          alt="check logo shield"
        />
        <h2 class="uppercase text-4xl font-bold mt-8 mb-2">
          Check
        </h2>
        <p class="text-lg">
          Helping retailers and clients transact with confidence
        </p>
      </div>
      <VerificationSearch />
    </main>
  );
}
