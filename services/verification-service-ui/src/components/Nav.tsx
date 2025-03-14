import { useLocation } from "@solidjs/router";

export default function Nav() {
  const location = useLocation();
  const active = (path: string) =>
    path == location.pathname ? "bg-sky-600" : "";
  return (
    <nav class="bg-sky-800 border-gray-200 dark:bg-gray-900 dark:border-gray-700">
      <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <div class="w-full md:block md:w-auto" id="navbar-dropdown">
          <ul class="flex flex-row p-0 mt-0 font-medium text-white rounded-lg rtl:space-x-reverse">
            {/* <ul class="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700"> */}
            <li>
              <a
                href="/"
                class={`block py-2 px-3 text-white rounded-sm hover:bg-sky-500 ${
                  active("/")
                }`}
                aria-current="page"
              >
                Home
              </a>
            </li>
            <li>
              <button
                id="dropdownNavbarLink"
                data-dropdown-toggle="dropdownNavbar"
                class="flex items-center justify-between w-full py-2 px-3 text-white rounded-sm hover:bg-sky-500"
              >
                Demo
                <svg
                  class="w-2.5 h-2.5 ms-2.5"
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
                    d="m1 1 4 4 4-4"
                  />
                </svg>
                <div
                  id="dropdownNavbar"
                  class="z-10 hidden font-normal bg-sky-700 divide-y divide-gray-100 rounded-lg shadow-sm"
                >
                  <ul
                    class="py-2 text-sm text-white text-left"
                    aria-labelledby="dropdownLargeButton"
                  >
                    <li>
                      <a
                        href="/?url=https://no-id-example.identinet.io"
                        class="block px-4 py-2 hover:bg-sky-500"
                      >
                        No DID document available
                      </a>
                    </li>
                    <li>
                      <a
                        href="/?url=https://id-plus-example.identinet.io"
                        class="block px-4 py-2 hover:bg-sky-500"
                      >
                        DID document and credentials available
                      </a>
                    </li>
                    <li>
                      <a
                        href="/?url=https://id-example.identinet.io"
                        class="block px-4 py-2 hover:bg-sky-500"
                      >
                        DID document available, no credentials
                      </a>
                    </li>
                    <li>
                      <a
                        href="/?url=https://broken-example.identinet.io"
                        class="block px-4 py-2 hover:bg-sky-500"
                      >
                        DID document incorrect or verification of credentials
                        failed
                      </a>
                    </li>
                  </ul>
                </div>
              </button>
            </li>
            <li>
              <a
                href="/about"
                class={`block py-2 px-3 text-white rounded-sm hover:bg-sky-500 ${
                  active("/about")
                }`}
              >
                About
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    /*
    <nav class="bg-sky-800">
      <ul class="container flex items-center p-3 text-gray-200">
        <li class={`border-b-2 ${active("/")} mx-1.5 sm:mx-6`}>
          <a href="/">Home</a>
        </li>
        <li class={`border-b-2 ${active("/about")} mx-1.5 sm:mx-6`}>
          <a href="/about">About</a>
        </li>
      </ul>
    </nav>
      */
  );
}
