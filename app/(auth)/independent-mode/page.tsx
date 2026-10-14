import { Suspense } from "react";

import IndependentModePage from "@/components/modules/auth/IndependentModePage";

export default function Page() {
  return (
    <Suspense>
      <IndependentModePage />
    </Suspense>
  );
}
