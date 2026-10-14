import Image from 'next/image';
import Link from 'next/link';

const PasswordResetSuccessPage = () => {
    return (
        <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-white overflow-hidden px-6 py-12">

            {/* Background blobs */}
            <div
                className="absolute bg-[#EBF9FB] rounded-full pointer-events-none"
                style={{ width: '110vw', height: '110vw', top: '-30vh', left: '-60vw' }}
            />
            <div
                className="absolute bg-[#F5EEFF] rounded-full pointer-events-none"
                style={{ width: '120vw', height: '120vw', bottom: '-30vh', right: '-50vw' }}
            />

            <div className="relative z-10 w-full max-w-md flex flex-col items-center">

                {/* Illustration */}
                <div className="mb-10">
                    <Image
                        src="/illustrations/pass-reset-successful.png"
                        alt="Password reset successful"
                        width={240}
                        height={240}
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-[#1D2E54] text-3xl font-bold tracking-tight">
                        Password Reset Successful!
                    </h1>
                    <p className="text-[#B0B0B0] text-base mt-3 leading-6">
                        You can proceed to login with your new password credentials.
                    </p>
                </div>

                {/* Back to Login button */}
                <Link
                    href="/signin"
                    className="w-full h-14 rounded-full text-white text-lg font-bold flex items-center justify-center hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(to right, #99D1E8, #C4A1FF)' }}
                >
                    Back to Login
                </Link>
            </div>
        </main>
    );
};

export default PasswordResetSuccessPage;
