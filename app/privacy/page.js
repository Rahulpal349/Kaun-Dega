import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Kaun Dega',
  description: 'Privacy Policy for Kaun Dega',
};

export default function PrivacyPolicy() {
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
              <Shield size={24} />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">Privacy Policy</h1>
              <p className="text-xs text-gray-400 font-medium">Last updated: September 2026</p>
            </div>
          </div>
          
          <div className="space-y-8 text-gray-700 text-sm sm:text-base leading-relaxed">
            <section>
              <h2 className="font-bold text-lg text-gray-900 mb-2">1. Information We Collect</h2>
              <p>When you use <strong>Kaun Dega?</strong>, we collect your basic profile details provided via Google Authentication (name, email, profile photo). We also securely store expense entries, group memberships, and settlement notes that you create in the app.</p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-gray-900 mb-2">2. How We Use Your Information</h2>
              <p>Your information is solely used to calculate shared expenses, synchronize group ledgers in real-time, generate settlement reports, and provide an effortless expense tracking experience.</p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-gray-900 mb-2">3. Data Sharing & Visibility</h2>
              <p>Expense descriptions, member names, and settlement amounts are shared exclusively with the members of the specific groups you create or join. <strong>We do not sell, rent, or monetize your personal data to third parties.</strong></p>
            </section>
            
            <section>
              <h2 className="font-bold text-lg text-gray-900 mb-2">4. Data Security</h2>
              <p>All communications with our Cloud Firestore database are encrypted using modern TLS/HTTPS protocols. We employ strict access controls so only authorized group members can read group records.</p>
            </section>

            <section className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-100">
              <h2 className="font-bold text-base text-gray-900 mb-2">Contact Us</h2>
              <p className="text-xs text-gray-600 mb-3">If you have any privacy questions or requests to delete your account data, please contact:</p>
              <div className="text-xs text-gray-700 space-y-1 font-medium">
                <p><span className="text-gray-400">Email:</span> privacy@kaundega.app</p>
                <p><span className="text-gray-400">Location:</span> India</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
