import { A } from "@solidjs/router";
import VerificationSearch from "~/components/VerificationSearch";

export default function Home() {
  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <div class="flex justify-center items-center mt-6 mb-10">
        <img
          class="w-32 h-32"
          src="/identinet-round-background-transparent.svg"
          alt="Identinet logo"
        />
      </div>
      <VerificationSearch />
      <p class="mt-10 mb-4">
        <span>Home</span>
        {" - "}
        <A href="/about" class="text-sky-600 hover:underline">
          About Page
        </A>
        {" "}
      </p>
    </main>
  );
}
