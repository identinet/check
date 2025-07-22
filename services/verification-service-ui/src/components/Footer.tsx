import { useLocation } from "@solidjs/router";
import { Component, JSX } from "solid-js";

export default function Footer(): Component<
  JSX.HTMLAttributes<HTMLDivElement>
> {
  const location = useLocation();
  const isActive = (path: string) => path == location.pathname;
  const active = (path: string) => isActive(path) ? "" : "text-primary-500";

  return (
    <footer>
      <div class="w-full mx-auto max-w-screen-xl p-4 flex justify-center">
        <ul class="flex flex-wrap items-center mt-3 text-sm font-medium text-gray-500 sm:mt-0">
          <li>
            <a href="/" class={`hover:underline me-4 md:me-6 ${active("/")}`}>
              Home
            </a>
          </li>
          <li>
            <a
              href="/about"
              classList={{ "hover:underline": true, [active("/about")]: true }}
            >
              About
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
