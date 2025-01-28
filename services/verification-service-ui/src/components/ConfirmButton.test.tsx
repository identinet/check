import { describe, expect, it } from "vitest";
import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import ConfirmButton from "./ConfirmButton";

const user = userEvent.setup();

describe("<ConfirmButton />", () => {
  it("opens modal", async () => {
    const { getByRole, getByText } = render(() => <ConfirmButton />);
    const btn = getByRole("button");
    expect(btn).toHaveTextContent("Toggle Flowbite modal");
  });
});
