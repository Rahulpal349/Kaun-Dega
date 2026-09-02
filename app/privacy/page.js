import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Kaun Dega',
  description: 'Privacy Policy for Kaun Dega',
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-green-50 py-12 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-ink/60 hover:text-primary mb-8 font-medium transition-colors">
          <ArrowLeft size={18} /> Back to Home
        </Link>
        
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 sm:p-12 md:p-16 border border-gray-100">
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink mb-8">Privacy Policy</h1>
          
          <div className="space-y-8 text-ink/80 text-base sm:text-lg leading-relaxed font-body">
            <section>
              <h2 className="font-bold text-xl text-ink mb-4">1. Information We Collect</h2>
              <p>We collect information you provide directly to us, such as your name, email address, mobile number, UPI ID, gender, and profile picture when you create an account. We also collect the expense data and group information you enter into the application.</p>
            </section>

            <section>
              <h2 className="font-bold text-xl text-ink mb-4">2. How We Use Your Information</h2>
              <p>We use the information we collect to provide, maintain, and improve our services, to calculate expense splits, notify you of balance changes, and to communicate with you about updates, security alerts, and support messages.</p>
            </section>

            <section>
              <h2 className="font-bold text-xl text-ink mb-4">3. Data Security</h2>
              <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage. Your data is securely stored and transmitted using industry-standard encryption.</p>
            </section>
            
            <section>
              <h2 className="font-bold text-xl text-ink mb-4">4. Sharing of Information</h2>
              <p>Your name, profile picture, and expense activity are visible to other members of the groups you join. We do not sell, rent, or trade your personal information to third parties. We may share information if required by law or to protect our rights.</p>
            </section>

            <section className="bg-soft-green/30 p-6 rounded-2xl mt-12 border border-soft-green">
              <h2 className="font-bold text-xl text-ink mb-4">Contact Information</h2>
              <p className="mb-4">If you have any questions or concerns about our Privacy Policy, please contact us at:</p>
              <ul className="space-y-2 font-medium">
                <li><span className="text-ink/60">Email:</span> THERAHULPAL@HOTMAIL.IN</li>
                <li><span className="text-ink/60">Mobile:</span> +91 8670464890</li>
                <li><span className="text-ink/60">Address:</span> BELIATORE, BANKURA, WEST BENGAL, PIN- 722203</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

