import type { APIEvent } from "@solidjs/start/server";
import process from "node:process";

export function GET(_event: APIEvent) {
  return {
    "vsi": `https://${process.env.EXTERNAL_VSI_HOSTNAME}`,
  };
}
