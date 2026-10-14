import { Suspense } from "react";

import ModeSelectorPage from "@/components/modules/auth/ModeSelectorPage";

export default function Page() {
  return (
    <Suspense>
      <ModeSelectorPage />
    </Suspense>
  );
}
