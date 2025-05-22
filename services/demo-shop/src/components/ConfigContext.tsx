import { createEffect } from "solid-js";
import { createContext, createResource, onMount, useContext } from "solid-js";
import { isServer } from "solid-js/web";

/**
 * @typedef {Object} ConfigDetails - Configuration Details
 * @property {Object} configDetails Verification Details.
 * @property {(Date|null)} fetched Date when details have been fetched.
 */

/** @type {ConfigDetails} */
const INITIAL_VALUE = {};

/** @typedef {[ConfigDetails]} ConfigContextData Configuration Context */

export const ConfigContext = createContext([
  INITIAL_VALUE,
]);

export default function ConfigProvider(props) {
  /* "use server"; */
  function fetchConfig(source, { value, refetching }) {
    /* console.log("source", source); */
    /* console.log("value", value); */
    /* console.log("refetching", refetching); */
    if (isServer) return Promise.resolve(INITIAL_VALUE);
    /* console.log("fetching for real"); */
    const url = new URL(document.URL);
    url.pathname = "api/config";
    url.search = "";
    return fetch(url).then((res) =>
      res.json().then((config) => {
        if (typeof config === "object") {
          return {
            ...INITIAL_VALUE,
            ...config,
          };
        } else {
          return INITIAL_VALUE;
        }
      })
    ).catch((err) => {
      console.error("Error while fetching the configuration", err);
      return INITIAL_VALUE;
    });
  }

  const [configDetails, { refetch }] = createResource(fetchConfig);

  const config = [
    configDetails,
    {
      refetch,
    },
  ];

  onMount(() => refetch());

  return (
    <ConfigContext.Provider value={config}>
      {props.children}
    </ConfigContext.Provider>
  );
}

export function useConfigContext(): ConfigContextData {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error(
      "useConfigContext: cannot find a ConfigContext",
    );
  }
  return context;
}
