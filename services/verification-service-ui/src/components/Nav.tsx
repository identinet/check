import { useLocation } from "@solidjs/router";

export default function Nav() {
  const location = useLocation();
  const isActive = (path: string) => path == location.pathname;
  const active = (path: string) =>
    isActive(path) ? "bg-primary-500" : "bg-transparent hover:bg-primary-300";

  const hideOnMain = () => location.search.indexOf("url=") < 0 ? "hidden" : "";

  return (
    <nav class={`bg-primary-600 border-gray-200 ${hideOnMain()}`}>
      <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a
          href="/"
          class="flex items-center space-x-1 rtl:space-x-reverse uppercase"
        >
          <img
            src="/logo-shield.svg"
            class="w-10 h-10"
            alt="check logo shield"
          />
          <span class="self-center text-2xl font-semibold whitespace-nowrap text-white">
            Check
          </span>
        </a>
        <div class="block w-auto" id="navbar-default">
          <ul class="font-medium flex flex-row p-0 rounded-lg mt-0 border-0">
            <li>
              <a
                href="/"
                class={`block text-white px-3 py-2 ${active("/")}`}
                aria-current={isActive("/") ? "page" : null}
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="/about"
                class={`block text-white px-3 py-2 ${active("/about")}`}
                aria-current={isActive("/about") ? "page" : null}
              >
                About
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
