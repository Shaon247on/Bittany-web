import { Suspense } from "react";

import BridgeModePage from "@/components/modules/auth/BridgeModePage";

export default function Page() {
  return (
    <Suspense>
      <BridgeModePage />
    </Suspense>
  );
}
