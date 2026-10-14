import { Suspense } from "react";

import JoinAccountPage from "@/components/modules/auth/JoinAccountPage";

export default function Page() {
  return (
    <Suspense>
      <JoinAccountPage />
    </Suspense>
  );
}
