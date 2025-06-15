import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      <div className="container mx-auto max-w-4xl p-4">
        {/* Header */}
        <div className="border-b border-green-600 pb-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-green-400">PRIVACY POLICY</h1>
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
            <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="mb-4">
              Intelligence Survival (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our CIA operations simulation game available at{' '}
              <span className="text-green-400">https://intelligence-survival.vercel.app</span>.
            </p>
            <p>
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium text-green-400 mb-3">2.1 Information from Google OAuth</h3>
            <p className="mb-4">
              When you sign in with Google, we collect the following information from your Google account:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4 text-gray-400">
              <li><strong>Email Address:</strong> Used for account identification and communication</li>
              <li><strong>Full Name:</strong> Displayed in your user profile</li>
              <li><strong>Profile Picture:</strong> Used for your avatar in the game</li>
              <li><strong>Google User ID:</strong> Used for secure account linking</li>
            </ul>

            <h3 className="text-lg font-medium text-green-400 mb-3">2.2 Game Data</h3>
            <p className="mb-4">We collect and store the following gameplay information:</p>
            <ul className="list-disc list-inside space-y-2 mb-4 text-gray-400">
              <li>Mission progress and completion status</li>
              <li>Decision choices and operational selections</li>
              <li>Game performance metrics and success scores</li>
              <li>Session data and round progression</li>
              <li>Risk assessment preferences and patterns</li>
            </ul>

            <h3 className="text-lg font-medium text-green-400 mb-3">2.3 Technical Data</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>IP address and general location information</li>
              <li>Browser type and version</li>
              <li>Device information and operating system</li>
              <li>Usage analytics and error logs</li>
            </ul>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the collected information for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><strong>Account Management:</strong> Creating and maintaining your user account</li>
              <li><strong>Game Functionality:</strong> Providing personalized gameplay experiences</li>
              <li><strong>Progress Tracking:</strong> Saving your mission progress and achievements</li>
              <li><strong>Analytics:</strong> Improving game mechanics and user experience</li>
              <li><strong>Security:</strong> Protecting against fraud and unauthorized access</li>
              <li><strong>Communication:</strong> Sending important updates about the service</li>
            </ul>
          </section>

          {/* Data Storage and Security */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Data Storage and Security</h2>
            
            <h3 className="text-lg font-medium text-green-400 mb-3">4.1 Data Storage</h3>
            <p className="mb-4">
              Your data is securely stored using Supabase, a trusted database service provider. 
              All data is encrypted in transit and at rest using industry-standard encryption protocols.
            </p>

            <h3 className="text-lg font-medium text-green-400 mb-3">4.2 Security Measures</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>OAuth 2.0 authentication (no passwords stored)</li>
              <li>HTTPS encryption for all data transmission</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and monitoring systems</li>
              <li>Data backup and recovery procedures</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Data Sharing and Disclosure</h2>
            <p className="mb-4">
              <strong>We do not sell, trade, or rent your personal information to third parties.</strong>
            </p>
            <p className="mb-4">We may share your information only in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
              <li><strong>Legal Requirements:</strong> When required by law or legal process</li>
              <li><strong>Safety and Security:</strong> To protect our users and prevent fraud</li>
              <li><strong>Service Providers:</strong> With trusted partners who help operate our service (under strict confidentiality)</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Your Privacy Rights</h2>
            <p className="mb-4">You have the following rights regarding your personal data:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Export your game data in a standard format</li>
              <li><strong>Withdrawal:</strong> Revoke consent for data processing</li>
              <li><strong>Objection:</strong> Object to certain types of data processing</li>
            </ul>
            <p className="mt-4 text-sm">
              To exercise these rights, please contact us at{' '}
              <span className="text-green-400">privacy@intelligence-survival.app</span>
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Cookies and Tracking</h2>
            <p className="mb-4">
              We use essential cookies and local storage to maintain your authentication session 
              and game state. We do not use tracking cookies for advertising purposes.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><strong>Authentication Cookies:</strong> Keep you logged in securely</li>
              <li><strong>Game State Storage:</strong> Save your current mission progress</li>
              <li><strong>Preference Storage:</strong> Remember your game settings</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Third-Party Services</h2>
            <p className="mb-4">Our service integrates with the following third-party providers:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><strong>Google OAuth:</strong> For secure authentication (Google Privacy Policy applies)</li>
              <li><strong>Supabase:</strong> For database and authentication services</li>
              <li><strong>Vercel:</strong> For hosting and deployment</li>
              <li><strong>OpenAI:</strong> For AI-powered game content generation</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Children&apos;s Privacy</h2>
            <p>
              Our service is not intended for children under 13 years of age. We do not knowingly 
              collect personal information from children under 13. If you are a parent or guardian 
              and believe your child has provided us with personal information, please contact us 
              immediately.
            </p>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. International Data Transfers</h2>
            <p>
              Your information may be stored and processed in the United States and other countries 
              where our service providers operate. We ensure appropriate safeguards are in place 
              for international data transfers in compliance with applicable privacy laws.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any 
              material changes by posting the new Privacy Policy on this page and updating the 
              &quot;Last Updated&quot; date. Your continued use of the service after changes become effective 
              constitutes acceptance of the revised Privacy Policy.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">12. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy or our privacy practices, 
              please contact us at:
            </p>
            <div className="bg-gray-900 border border-green-600 rounded p-4 text-sm">
              <p><strong>Email:</strong> privacy@intelligence-survival.app</p>
              <p><strong>Website:</strong> https://intelligence-survival.vercel.app</p>
              <p><strong>Response Time:</strong> We aim to respond within 48 hours</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-700 text-center">
          <p className="text-gray-500 text-sm">
            Intelligence Survival © 2024 - Educational CIA Operations Simulation
          </p>
          <div className="mt-2 space-x-4 text-sm">
            <Link href="/terms" className="text-blue-400 hover:text-blue-300">Terms of Service</Link>
            <Link href="/" className="text-green-400 hover:text-green-300">Back to Game</Link>
          </div>
        </div>
      </div>
    </div>
  );
} 