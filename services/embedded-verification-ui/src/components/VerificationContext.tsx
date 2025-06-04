import { createContext, createResource, useContext } from "solid-js";
import { useConfigContext } from "~/components/ConfigContext";

export const INITIAL_VERIFICATION_DETAILS = {};
export const INITIAL_FETCHED: Date | null = null;

/**
 * @typedef {Object} VerificationDetails
 * @property {Object} verificationDetails Verification Details.
 * @property {(Date|null)} fetched Date when details have been fetched.
 */

/**
 * @type {VerificationDetails}
 */
const INITIAL_VALUE = {
  verificationDetails: INITIAL_VERIFICATION_DETAILS,
  fetched: INITIAL_FETCHED,
};

const INITIAL_SETTERS = {
  refetch: () => {},
};

/**
 * @typedef {[VerificationDetails, URL, Object]} VerificationContextData Verification Context
 */

export const VerificationContext = createContext([
  INITIAL_VALUE,
  INITIAL_SETTERS,
]);

export default function VerificationProvider(props) {
  const [config] = useConfigContext();
  function fetcher(source, { value, refetching }) {
    if (source.vs) {
      const url = new URL(config().vs);
      url.pathname = "/v1/verification";
      // FIXME: enable proper fetching
      url.searchParams.set("q", new URL(document.URL).origin.toString());
      return fetch(url, { mode: "cors" }).then((res) => res.json()).then(
        (data) => {
          let verified = false;
          if (data?.results instanceof Array) {
            // FIXME: ensure that results are properly defined - waiting for verification of results
            verified = true;
          }
          return {
            ...data,
            verified,
          };
        },
      );
    }
    return Promise.reject(new Error("Source not yet ready"));
  }

  const [verificationDetails, { refetch: refetchVerificationDetails }] =
    createResource(config, fetcher);

  const verification = [
    verificationDetails,
    {
      refetch() {
        refetchVerificationDetails();
      },
    },
  ];

  return (
    <VerificationContext.Provider value={verification}>
      {props.children}
    </VerificationContext.Provider>
  );
}

export function useVerificationContext(): VerificationContextData {
  const context = useContext(VerificationContext);
  if (!context) {
    throw new Error(
      "useVerificationContext: cannot find a VerificationContext",
    );
  }
  return context;
}
