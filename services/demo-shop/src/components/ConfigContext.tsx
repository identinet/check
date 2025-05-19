import { createContext, createResource, onMount, useContext } from "solid-js";
import { isServer } from "solid-js/web";

/**
 * @typedef {Object} ConfigDetails
 * @property {Object} configDetails Verification Details.
 * @property {(Date|null)} fetched Date when details have been fetched.
 */

/**
 * @type {ConfigDetails}
 */
const INITIAL_VALUE = {};

/**
 * @typedef {[ConfigDetails]} ConfigContextData Verification Context
 */

export const ConfigContext = createContext([
  INITIAL_VALUE,
]);

export default function ConfigProvider(props) {
  function fetchConfig(source, { value, refetching }) {
    console.log("source", source);
    console.log("value", value);
    console.log("refetching", refetching);
    if (isServer) return;
    console.log("fetching for real");
    const url = new URL(document.URL);
    url.pathname = "config.json";
    return fetch(url).then((res) => res.json());
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
