import type { APIEvent } from "@solidjs/start/server";
import process from "node:process";

export async function GET(event: APIEvent) {
  console.debug("config");

  return {
    "vsi": `https://${process.env.EXTERNAL_EVI_HOSTNAME}`,
  };
}
