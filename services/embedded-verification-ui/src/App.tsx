import "virtual:uno.css";
import { Component } from "solid-js";
import VerificationProvider from "~/components/VerificationContext";
import { default as ConfigProvider, useConfigContext } from "~/components/ConfigContext";
import VerificationStatus from "~/VerificationStatus";

const App: Component = () => {
  const [config] = useConfigContext();
  return (
    <VerificationProvider
      apiUrl={config()?.vs}
    >
      <VerificationStatus />
    </VerificationProvider>
  );
};

const Root: Component = () => {
  return (
    <ConfigProvider>
      <App />
    </ConfigProvider>
  );
};

export default Root;
