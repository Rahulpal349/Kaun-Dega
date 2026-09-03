import Link from 'next/link';
import { ArrowLeft, Shield, FileText, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Kaun Dega',
  description: 'Terms of Service and Conditions for Kaun Dega',
};

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-green-50/60 py-10 px-4 sm:px-6 lg:px-8 font-body">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#145C4B] hover:text-[#0E382F] bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Sign In
        </Link>
        
        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 p-6 sm:p-10 md:p-12 border border-gray-100">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#145C4B] flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">Terms of Service</h1>
              <p className="text-xs text-gray-400 font-medium">Last updated: September 2026</p>
            </div>
          </div>
          
          <div className="space-y-8 text-gray-700 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="font-bold text-lg text-gray-900 mb-2">1. Acceptance of Terms</h2>
              <p>By accessing and using <strong>Kaun Dega?</strong>, you acknowledge and agree to comply with these Terms of Service. If you disagree with any part of these terms, please discontinue using the service.</p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-gray-900 mb-2">2. Description of the Service</h2>
              <p>Kaun Dega provides users with collaborative tools to record, track, calculate, and simplify group expenses among friends, flatmates, and travel groups. <strong>Kaun Dega is an informational expense ledger and settlement calculator</strong> — it does not directly process or hold banking funds.</p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-gray-900 mb-2">3. User Accounts & Google Authentication</h2>
              <p>You access the Service securely via Google Authentication. You are responsible for safeguarding your Google account credentials and for all activities that occur under your account.</p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-gray-900 mb-2">4. User Responsibilities & Content</h2>
              <p>You agree to enter accurate expense records and use the application solely for lawful purposes. You shall not misuse the service to distribute malicious, fraudulent, or harmful information.</p>
            </section>
            
            <section>
              <h2 className="font-bold text-lg text-gray-900 mb-2">5. Limitation of Liability</h2>
              <p>Kaun Dega provides automated debt-simplification algorithms to assist users. While we strive for absolute mathematical precision, Kaun Dega is provided on an "as is" and "as available" basis without warranties of any kind.</p>
            </section>

            <section className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-100">
              <h2 className="font-bold text-base text-gray-900 mb-2">Questions or Support</h2>
              <p className="text-xs text-gray-600 mb-3">If you have any questions regarding these Terms, feel free to reach out to our team:</p>
              <div className="text-xs text-gray-700 space-y-1 font-medium">
                <p><span className="text-gray-400">Email:</span> support@kaundega.app</p>
                <p><span className="text-gray-400">Location:</span> India</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
