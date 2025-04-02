// Alternative redis store
import Valkey from "iovalkey";

let valkey_store;

/**
 * Get Valkey store instance.
 */
export function getValkeyStore() {
  if (!valkey_store) {
    // Create a Redis client instance
    valkey_store = new Valkey({
      host: "127.0.0.1",
      port: 6379,
    });
    valkey_store.on("connect", () => console.log("✅ Connected to valkey"));
    valkey_store.on("error", (err) => console.error("❌ valkey error:", err));
  }
  return valkey_store;
}

/**
 * Retrieve json from Valkey Store.
 */
export const getJson = async (store, id) => {
  const data = await store.get(id);
  if (data) {
    return JSON.parse(data);
  }
};
