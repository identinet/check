import { Component, JSX } from "solid-js";

const classesInvalid =
  "bg-gradient-from-invalid-100 bg-gradient-via-invalid-100 bg-gradient-to-invalid-500 border-invalid-900";

type Props = {
  icon: string;
  message: string;
} & JSX.HTMLAttributes<HTMLDivElement>;

export function ErrorCard(props): Component<Props> {
  return (
    <>
      <div>
        {/* dummy element to keep the grid in place */}
      </div>
      <div
        class={`p-6 bg-gradient-linear border-2 rounded-md shadow-sm ${classesInvalid}`}
      >
        {props.icon && (
          <div class="mb-4 flex items-center justify-center text-xl font-bold tracking-tight text-gray-900">
            <div class={`${props.icon} me-2 w-8 h-8 shrink-0`} />
          </div>
        )}
        {props.message &&
          (
            <div class="mb-3">
              {props.message}
            </div>
          )}
      </div>
    </>
  );
}
