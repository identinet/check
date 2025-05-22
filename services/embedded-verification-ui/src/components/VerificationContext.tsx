import { createContext, createResource, useContext } from "solid-js";

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
  function fetcher(source, { value, refetching }) {
    // TODO: pull status from Verification Service
    return Promise.resolve({ verified: true }).then((res) => {
      return { verificationDetails: res, fetched: new Date() };
    });
  }

  const [verificationDetails, { refetch: refetchVerificationDetails }] =
    createResource(fetcher);

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
