import "virtual:uno.css";
import { Component } from "solid-js";
import VerificationProvider from "~/components/Context";
import VerificationStatus from "~/VerificationStatus";

const VERIFICATION_SERVICE_API_URL = "https://api.check.identinet.io";
const VERIFICATION_SERVICE_UI_URL = "https://check.identinet.io";

const App: Component = () => {
  return (
    <VerificationProvider
      uiUrl={VERIFICATION_SERVICE_UI_URL}
      apiUrl={VERIFICATION_SERVICE_API_URL}
    >
      <VerificationStatus />
    </VerificationProvider>
  );
};

export default App;
