import { Suspense } from 'react';
import OtpPage from '@/components/modules/auth/OtpPage';

export default function Page() {
    return (
        <Suspense>
            <OtpPage />
        </Suspense>
    );
}
