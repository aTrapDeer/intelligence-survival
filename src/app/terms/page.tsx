import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <div className="container mx-auto max-w-4xl p-4">
        {/* Header */}
        <div className="border-b border-green-600 pb-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-green-400">TERMS OF SERVICE</h1>
              <p className="text-sm text-gray-400">Intelligence Survival - CIA Operations Simulation</p>
            </div>
            <Link 
              href="/" 
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Back to Game
            </Link>
          </div>
        </div>

        <div className="space-y-8 text-gray-300">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              Welcome to Intelligence Survival, a CIA operations simulation game. These Terms of Service 
              (&quot;Terms&quot;) govern your use of our service available at{' '}
              <span className="text-green-400">https://intelligence-survival.vercel.app</span> 
              {' '}(&quot;Service&quot;) operated by Intelligence Survival (&quot;us&quot;, &quot;we&quot;, or &quot;our&quot;).
            </p>
            <p className="mb-4">
              By accessing or using our Service, you agree to be bound by these Terms. If you disagree 
              with any part of these terms, then you may not access the Service.
            </p>
            <p>
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Service Description</h2>
            <p className="mb-4">
              Intelligence Survival is an educational simulation game that allows users to experience 
              CIA-style intelligence operations through interactive scenarios. The Service includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Interactive CIA mission simulations</li>
              <li>Decision-based gameplay with multiple outcomes</li>
              <li>Progress tracking and performance analytics</li>
              <li>User account management via Google OAuth</li>
              <li>Secure data storage and session management</li>
            </ul>
          </section>

          {/* Educational Disclaimer */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Educational Disclaimer</h2>
            <div className="bg-yellow-900/20 border border-yellow-600 rounded p-4 mb-4">
              <p className="text-yellow-300 font-semibold mb-2">⚠️ IMPORTANT DISCLAIMER</p>
              <p className="text-yellow-200">
                Intelligence Survival is a fictional educational simulation. The scenarios, procedures, 
                and information presented are for entertainment and educational purposes only.
              </p>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>This game does not represent actual CIA operations or procedures</li>
              <li>No classified or sensitive information is used or disclosed</li>
              <li>The game content is entirely fictional and speculative</li>
              <li>Users should not attempt to apply game scenarios to real-world situations</li>
              <li>We are not affiliated with the Central Intelligence Agency or any government agency</li>
            </ul>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. User Accounts</h2>
            
            <h3 className="text-lg font-medium text-green-400 mb-3">4.1 Account Creation</h3>
            <p className="mb-4">
              To access the Service, you must create an account using Google OAuth authentication. 
              By creating an account, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4 text-gray-400">
              <li>Provide accurate and current information</li>
              <li>Maintain the security of your Google account</li>
              <li>Be responsible for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>

            <h3 className="text-lg font-medium text-green-400 mb-3">4.2 Account Restrictions</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>You must be at least 13 years old to create an account</li>
              <li>One account per person - multiple accounts are prohibited</li>
              <li>Accounts cannot be transferred or shared with others</li>
              <li>We reserve the right to suspend or terminate accounts for violations</li>
            </ul>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Acceptable Use Policy</h2>
            <p className="mb-4">You agree not to use the Service to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Violate any laws or regulations</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Reverse engineer, hack, or exploit the Service</li>
              <li>Use automated scripts or bots</li>
              <li>Share false or misleading information</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to extract or misuse any real intelligence information</li>
              <li>Use the Service for any illegal intelligence activities</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Intellectual Property Rights</h2>
            
            <h3 className="text-lg font-medium text-green-400 mb-3">6.1 Our Content</h3>
            <p className="mb-4">
              The Service and its original content, features, and functionality are owned by Intelligence 
              Survival and are protected by international copyright, trademark, patent, trade secret, 
              and other intellectual property laws.
            </p>

            <h3 className="text-lg font-medium text-green-400 mb-3">6.2 User-Generated Content</h3>
            <p className="mb-4">
              By using our Service, you grant us a non-exclusive, worldwide, royalty-free license to 
              use, reproduce, and display your gameplay data for the purpose of providing and improving 
              the Service.
            </p>

            <h3 className="text-lg font-medium text-green-400 mb-3">6.3 Third-Party Content</h3>
            <p>
              The Service may contain content generated by OpenAI&apos;s language models. Such content is 
              subject to OpenAI&apos;s terms and conditions.
            </p>
          </section>

          {/* Privacy and Data */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Privacy and Data Protection</h2>
            <p className="mb-4">
              Your privacy is important to us. Our Privacy Policy explains how we collect, use, 
              and protect your information when you use our Service. By using the Service, you 
              agree to the collection and use of information in accordance with our Privacy Policy.
            </p>
            <p>
              <Link href="/privacy" className="text-green-400 hover:text-green-300 underline">
                View our Privacy Policy →
              </Link>
            </p>
          </section>

          {/* Service Availability */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Service Availability</h2>
            <p className="mb-4">
              We strive to provide a reliable service, but we cannot guarantee uninterrupted access:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>The Service may be temporarily unavailable for maintenance</li>
              <li>We may modify or discontinue features without notice</li>
              <li>Access may be limited due to technical issues or high demand</li>
              <li>We are not liable for any downtime or service interruptions</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
            <div className="bg-red-900/20 border border-red-600 rounded p-4 mb-4">
              <p className="text-red-300 font-semibold mb-2">⚠️ LIABILITY LIMITATION</p>
              <p className="text-red-200 text-sm">
                The Service is provided &quot;as is&quot; without warranties of any kind. We shall not be liable 
                for any direct, indirect, incidental, special, consequential, or punitive damages.
              </p>
            </div>
            <p className="mb-4">Specifically, we are not liable for:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Loss of data or game progress</li>
              <li>Interruption of service or technical issues</li>
              <li>Any decisions made based on game scenarios</li>
              <li>Unauthorized access to your account</li>
              <li>Any damages resulting from use of the Service</li>
            </ul>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Intelligence Survival and its 
              affiliates from and against any claims, damages, obligations, losses, liabilities, 
              costs, or debt arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Termination</h2>
            
            <h3 className="text-lg font-medium text-green-400 mb-3">11.1 By You</h3>
            <p className="mb-4">You may terminate your account at any time by:</p>
            <ul className="list-disc list-inside space-y-2 mb-4 text-gray-400">
              <li>Signing out and discontinuing use of the Service</li>
              <li>Contacting us to request account deletion</li>
              <li>Revoking Google OAuth permissions</li>
            </ul>

            <h3 className="text-lg font-medium text-green-400 mb-3">11.2 By Us</h3>
            <p className="mb-4">We may terminate or suspend your account if you:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Violate these Terms of Service</li>
              <li>Engage in prohibited activities</li>
              <li>Attempt to compromise system security</li>
              <li>Remain inactive for an extended period</li>
            </ul>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">12. Governing Law</h2>
            <p>
              These Terms shall be interpreted and governed by the laws of the United States, 
              without regard to its conflict of law provisions. Any disputes arising from these 
              Terms will be resolved through binding arbitration.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">13. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify or replace these Terms at any time. If a revision 
              is material, we will provide at least 30 days notice prior to any new terms taking effect.
            </p>
            <p>
              Your continued use of the Service after changes become effective constitutes acceptance 
              of the revised Terms.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">14. Contact Information</h2>
            <div className="bg-gray-900 border border-green-600 rounded p-4 text-sm">
              <p><strong>Email:</strong> support@intelligence-survival.app</p>
              <p><strong>Website:</strong> https://intelligence-survival.vercel.app</p>
            </div>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">15. Severability</h2>
            <p>
              If any provision of these Terms is held to be invalid or unenforceable by a court, 
              the remaining provisions will remain in effect. This constitutes the entire agreement 
              between us regarding our Service.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-700 text-center">
          <p className="text-gray-500 text-sm">
            Intelligence Survival © 2024 - Educational CIA Operations Simulation
          </p>
          <div className="mt-2 space-x-4 text-sm">
            <Link href="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</Link>
            <Link href="/" className="text-green-400 hover:text-green-300">Back to Game</Link>
          </div>
        </div>
      </div>
    </div>
  );
} 