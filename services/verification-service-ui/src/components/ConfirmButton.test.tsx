import { describe, expect, it } from "vitest";
import { render } from "@solidjs/testing-library";
import ConfirmButton from "./ConfirmButton";

describe("<ConfirmButton />", () => {
  it("opens modal", () => {
    const { getByRole } = render(() => <ConfirmButton />);
    const btn = getByRole("button");
    expect(btn).toHaveTextContent("Toggle Flowbite modal");
  });
});
