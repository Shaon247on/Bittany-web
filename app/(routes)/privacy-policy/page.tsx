export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "1. Information We Collect",
      content: [
        "A. Account Information",
        "We may collect:",
        "• Full name",
        "• Email address",
        "• Phone number",
        "• Subscription status",
        "• Co-parent connection information",
        "",
        "B. Communication Data",
        "To provide secure co-parent communication services, we may collect:",
        "• SMS messages sent and received through ParentBridge proxy numbers",
        "• Call logs including date, time, duration, and call status",
        "• Voice call data and in-app audio call signals (powered by Twilio and ZEGOCLOUD)",
        "• Assigned virtual proxy phone numbers",
        "• Call recordings (only if enabled by users)",
        "",
        "C. Device & Technical Data",
        "We may collect:",
        "• IP address",
        "• Device type",
        "• Browser/app usage information",
        "• Audio device permissions required for voice calls",
        "• Login activity and system logs",
        ],
    },
    {
      title: "2. How We Use Your Information",
      content: [
        "We use collected information to:",
        "• Provide secure one-to-one co-parent communication",
        "• Route SMS messages and voice calls through proxy phone numbers and ZEGOCLOUD voice call services",
        "• Verify users using OTP authentication",
        "• Assign and manage virtual phone numbers",
        "• Process subscriptions and payments",
        "• Maintain communication records and call logs",
        "• Improve service reliability and platform security",
        "• Comply with legal obligations",
        "",
        "ParentBridge does NOT send marketing or promotional SMS messages.",
      ],
    },
    {
      title: "3. One-to-One Co-Parent Communication",
      content: [
        "ParentBridge is designed exclusively for communication between verified co-parents.",
        "Each ParentBridge proxy number or voice session is assigned only between two approved users. Users cannot send SMS messages or place calls to unknown third-party numbers using the platform.",
        "If one co-parent is not actively using the ParentBridge mobile app or website, communication may continue through the assigned ParentBridge proxy number using standard SMS or voice calls.",
        "Personal phone numbers remain private and are masked through virtual proxy numbers and secure in-app calling services.",
      ],
    },
    {
      title: "4. Consent to Receive SMS & Voice Communications",
      content: [
        "ParentBridge collects explicit consent before enabling SMS and voice communication.",
        "By creating an account, verifying your phone number using OTP verification, and accepting our Terms of Service, you consent to:",
        "• Receive transactional SMS and voice communications related to co-parent coordination",
        "• Have messages routed through ParentBridge proxy phone numbers",
        "• Initiate and receive in-app voice calls serviced via ZEGOCLOUD",
        "• Store communication data necessary for platform functionality",
        "",
        "During registration, users must actively agree to receive SMS communications.",
        "Invited co-parents must explicitly accept the invitation before communication is enabled.",
        "",
        "Example consent disclosure:",
        "\"I agree to receive SMS messages from ParentBridge for co-parent communication using a proxy phone number. Message frequency varies. Message and data rates may apply. Reply STOP to opt out and HELP for help.\"",
        "",
        "Users may opt out at any time by:",
        "• Replying STOP to any SMS message",
        "• Disabling messaging in the ParentBridge app",
        "• Contacting support at support@myparentbridge.com",
        "",
        "For support, users may reply HELP or contact support@myparentbridge.com.",
        "Message frequency varies based on user communication activity. Standard message and data rates may apply.",
      ],
    },
    {
      title: "5. Third-Party Service Providers & Data Sharing",
      content: [
        "We use trusted third-party service providers to operate our services, including:",
        "• Twilio for SMS routing and phone-based voice communications",
        "• ZEGOCLOUD for real-time in-app voice and audio call services",
        "• Payment processors for billing and subscriptions",
        "• Cloud hosting and database infrastructure providers",
        "",
        "These providers process user data (such as temporary access tokens, user IDs, call metadata, and audio streams necessary for call setup and media transmission) only as necessary to provide ParentBridge services.",
        "No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.",
      ],
    },
    {
      title: "6. Data Retention & Account Deletion Request",
      content: [
        "Communication records may be retained while accounts remain active.",
        "Users may request permanent account deletion and data removal at any time by submitting a request through our public Account Deletion Request page at https://myparentbridge.com/delete-account or contacting support@myparentbridge.com.",
        "Certain logs and records may be retained for:",
        "• Legal obligations",
        "• Fraud prevention",
        "• Security monitoring",
        "• Compliance purposes",
        "",
        "Deleted accounts may retain limited information where legally required.",
        "Proxy phone numbers may be released after extended subscription inactivity. Permanent number retention is not guaranteed.",
      ],
    },
    {
      title: "7. Security",
      content: [
        "We implement industry-standard safeguards to protect user information, including:",
        "• HTTPS encryption",
        "• Secure server infrastructure",
        "• Access control restrictions",
        "• Webhook validation",
        "• Authentication and monitoring systems",
        "",
        "However, no method of electronic transmission or storage is completely secure.",
      ],
    },
    {
      title: "8. Children's Privacy",
      content: [
        "ParentBridge is intended for use by adults, parents, and legal guardians. We do not knowingly collect personal information from individuals under 18 years of age.",
      ],
    },
    {
      title: "9. Updates to This Privacy Policy",
      content: [
        "We may update this Privacy Policy periodically.",
        "Updated versions will be posted on this page with a revised effective date.",
        "Continued use of ParentBridge after updates constitutes acceptance of the revised policy.",
      ],
    },
    {
      title: "10. Contact Us",
      content: [
        "ParentBridge LLC",
        "Email: support@myparentbridge.com",
        "Website: https://myparentbridge.com",
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-[#f8fafc] px-6 py-16">
      <div className="mx-auto max-w-5xl">
        {/* Hero Section */}
        <div className="mb-14 text-center">
          <div className="mb-5 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            ParentBridge LLC
          </div>

          <h1 className="mb-5 text-5xl font-bold tracking-tight text-slate-900">
            Privacy Policy
          </h1>

          <p className="text-base text-slate-500">
            Effective Date: May 12, 2026
          </p>
        </div>

        {/* Intro */}
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="leading-8 text-slate-600">
            ParentBridge LLC (“ParentBridge”, “we”, “our”, or
            “us”) is committed to protecting your privacy. This
            Privacy Policy explains what information we collect,
            how we use it, and your rights regarding your data.
          </p>
        </div>

        {/* Policy Sections */}
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
            Questions or Concerns?
          </h3>

          <p className="mx-auto mb-6 max-w-2xl text-slate-300">
            If you have any questions regarding this Privacy
            Policy or your data, please contact our support team.
          </p>

          <div className="flex flex-col items-center gap-3">
            <a
              href="mailto:support@myparentbridge.com"
              className="inline-flex items-center rounded-2xl bg-white px-6 py-3 font-medium text-slate-900 transition-all duration-300 hover:scale-105"
            >
              support@myparentbridge.com
            </a>

            <a
              href="/terms-conditions"
              className="text-sm text-slate-300 underline underline-offset-4"
            >
              View Terms & Conditions
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}



