import { useLocation } from "@solidjs/router";

export default function Nav() {
  const location = useLocation();
  const active = (path: string) =>
    path == location.pathname
      ? "border-sky-600"
      : "border-transparent hover:border-sky-600";
  return (
    <nav class="bg-sky-800">
      <ul class="container flex items-center p-3 text-gray-200">
        <li class={`border-b-2 ${active("/")} mx-1.5 sm:mx-6`}>
          <a href="/">
            <div class="i-flowbite:cart-outline" />&nbsp; Shopping Cart
          </a>
        </li>
        <li
          class={`border-b-2 ${active("/credentials")} mx-1.5 sm:mx-6`}
        >
          <a href="/credentials">
            <div class="i-flowbite:address-book-outline" />&nbsp; Credentials
          </a>
        </li>
        <li
          class={`border-b-2 ${active("/checkout")} mx-1.5 sm:mx-6`}
        >
          <a href="/checkout">
            <div class="i-flowbite:credit-card-outline" />&nbsp; Checkout
          </a>
        </li>
      </ul>
    </nav>
  );
}
