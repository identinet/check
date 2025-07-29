import { createContext, createResource, useContext } from "solid-js";
import { isServer } from "solid-js/web";

/**
 * @typedef {Object} ConfigDetails - Configuration Details
 * @property {string} vsi - Verification Service Interface URL.
 * @property {string} vs - Verification Service API URL.
 */

/** @type {ConfigDetails} */
const INITIAL_VALUE = {
  "vs": "https://api.check.identinet.io",
  "vsi": "https://check.identinet.io",
};

const INITIAL_FUNCTIONS = {
  refetch: () => {},
};

/** @typedef {[ConfigDetails]} ConfigContextData Configuration Context */

export const ConfigContext = createContext([
  INITIAL_VALUE,
  INITIAL_FUNCTIONS,
]);

export default function ConfigProvider(props) {
  function fetchConfig(_source, { value: _value, refetching: _refetching }) {
    if (isServer) return Promise.resolve(INITIAL_VALUE);
    const url = new URL(import.meta.url);
    url.pathname = "config/config.json";
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
