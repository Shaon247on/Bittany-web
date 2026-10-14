import React from "react";
import DashboardGate from "@/components/global/DashboardGate";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return <DashboardGate>{children}</DashboardGate>;
}
