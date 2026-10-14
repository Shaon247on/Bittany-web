"use client";

import { useState } from "react";
import WelcomeScreen from "@/components/global/WelcomePage";

type AppWelcomeGateProps = {
  children: React.ReactNode;
};

export default function AppWelcomeGate({ children }: AppWelcomeGateProps) {
  const [showWelcome, setShowWelcome] = useState(true);

  if (showWelcome) {
    return <WelcomeScreen onFinish={() => setShowWelcome(false)} />;
  }

  return <>{children}</>;
}