import { Suspense } from "react";
import BasicInfoPage from "@/components/modules/auth/BasicInfoPage";

export default function Page() {
  return (
    <Suspense>
      <BasicInfoPage />
    </Suspense>
  );
}
