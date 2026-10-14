export default function TermsAndConditionsPage() {
  const sections = [
    {
      title: "1. Service Description",
      content: [
        "ParentBridge is a subscription-based co-parenting communication platform. It enables two users to communicate privately via SMS and voice calls using a masked proxy phone number. Real phone numbers are never shared between users.",
        "ParentBridge does not provide legal advice.",
      ],
    },
    {
      title: "2. Eligibility",
      content: [
        "To use ParentBridge, you must:",
        "• Be at least 18 years old.",
        "• Be a parent or legal guardian.",
        "• Provide accurate and complete account information.",
      ],
    },
    {
      title: "3. Subscription & Billing",
      content: [
        "Premium users receive a dedicated proxy phone number, SMS messaging, and voice call routing.",
        "Subscription fees are billed monthly or annually.",
        "Failure to pay may result in suspension and eventual release of your assigned proxy number after 90 days of inactivity.",
      ],
    },
    {
      title: "4. Number Assignment & Release",
      content: [
        "Each premium user is assigned a virtual phone number for service use only; numbers are not owned by users.",
        "If your subscription is inactive for 90 days, your number may be released. Upon reactivation, a new number may be assigned.",
        "Permanent retention of numbers is not guaranteed.",
      ],
    },
    {
      title: "5. Message & Call Usage",
      content: [
        "ParentBridge is intended solely for:",
        "• One-to-one communication between co-parents.",
        "• Child-related coordination and communication.",
        "",
        "Prohibited uses include:",
        "• Harassment, threats, or abuse.",
        "• Spam, marketing, or promotional messaging.",
        "• Fraud, impersonation, or illegal activity.",
        "",
        "Violations may result in account suspension or termination.",
      ],
    },
    {
      title: "6. SMS & Voice Disclosure",
      content: [
        "By using ParentBridge, you consent to sending and receiving SMS and voice calls through proxy phone numbers.",
        "Message and data rates may apply.",
        "Message frequency varies based on user activity.",
        "You may opt out of SMS at any time by replying STOP.",
        "For help, reply HELP or contact support@myparentbridge.com.",
      ],
    },
    {
      title: "7. Call Recording (If Enabled)",
      content: [
        "Calls may be recorded for record-keeping if this feature is enabled.",
        "Users are responsible for complying with all applicable consent and recording laws in their jurisdiction.",
      ],
    },
    {
      title: "8. Data Storage & Legal Compliance",
      content: [
        "ParentBridge may store communication records for service operation, legal compliance, and documentation purposes.",
        "Users are responsible for the use of any exported records.",
      ],
    },
    {
      title: "9. Limitation of Liability",
      content: [
        "ParentBridge is not responsible for:",
        "• Carrier delivery delays or failures.",
        "• Service interruptions.",
        "• Released or reassigned phone numbers.",
        "• User-generated content.",
      ],
    },
    {
      title: "10. Account Termination",
      content: [
        "We may suspend or terminate accounts for:",
        "• Violation of these terms.",
        "• Illegal activity.",
        "• Abuse or misuse of the service.",
      ],
    },
    {
      title: "11. Governing Law",
      content: [
        "These Terms are governed by the laws of the State of Tennessee, United States.",
      ],
    },
    {
      title: "12. Updates to Terms",
      content: [
        "ParentBridge may update these Terms and Conditions at any time. Updates will be posted on this page with a new effective date.",
        "Continued use of the service constitutes acceptance of updated terms.",
      ],
    },
    {
      title: "13. Contact",
      content: [
        "ParentBridge LLC",
        "Email: support@myparentbridge.com",
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-[#f8fafc] px-6 py-16">
      <div className="mx-auto max-w-5xl">
        {/* Hero */}
        <div className="mb-14 text-center">
          <div className="mb-5 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            ParentBridge LLC
          </div>

          <h1 className="mb-5 text-5xl font-bold tracking-tight text-slate-900">
            Terms & Conditions
          </h1>

          <p className="text-base text-slate-500">
            Effective Date: 08-03-2026
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <section
              key={index}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <h2 className="mb-5 text-2xl font-semibold text-slate-900">
                {section.title}
              </h2>

              <div className="space-y-3">
                {section.content.map((paragraph, idx) => (
                  <p
                    key={idx}
                    className="leading-8 text-slate-600"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-14 rounded-3xl bg-slate-900 px-8 py-10 text-center text-white">
          <h3 className="mb-3 text-2xl font-semibold">
            Privacy Policy
          </h3>

          <p className="mx-auto mb-6 max-w-2xl text-slate-300">
            Please review our Privacy Policy to understand how
            ParentBridge collects, stores, and protects user data.
          </p>

          <a
            href="/privacy-policy"
            className="inline-flex items-center rounded-2xl bg-white px-6 py-3 font-medium text-slate-900 transition-all duration-300 hover:scale-105"
          >
            View Privacy Policy
          </a>
        </div>
      </div>
    </main>
  );
}