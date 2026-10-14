"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());
    const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const googleClientId = (!envClientId || envClientId === "your_google_client_id_here")
        ? "604145237005-2i0evqsbosvdv3mplqtm9p0go4v11ha2.apps.googleusercontent.com"
        : envClientId;

    const content = (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );

    if (!googleClientId) {
        return content;
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            {content}
        </GoogleOAuthProvider>
    );
}
