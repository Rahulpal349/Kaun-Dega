import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Use | Kaun Dega',
  description: 'Terms of Use and Conditions for Kaun Dega',
};

export default function TermsOfUse() {
  return (
    <main className="min-h-screen bg-green-50 py-12 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-ink/60 hover:text-primary mb-8 font-medium transition-colors">
          <ArrowLeft size={18} /> Back to Home
        </Link>
        
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 sm:p-12 md:p-16 border border-gray-100">
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink mb-8">Terms of Use</h1>
          
          <div className="space-y-8 text-ink/80 text-base sm:text-lg leading-relaxed font-body">
            <section>
              <h2 className="font-bold text-xl text-ink mb-4">1. Acceptance of Terms</h2>
              <p>By accessing and using Kaun Dega ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>
            </section>

            <section>
              <h2 className="font-bold text-xl text-ink mb-4">2. Description of Service</h2>
              <p>Kaun Dega provides users with tools to track and split expenses among friends, groups, and trips. We do not process payments directly; we solely track balances and provide settlement calculations.</p>
            </section>

            <section>
              <h2 className="font-bold text-xl text-ink mb-4">3. User Conduct</h2>
              <p>You agree to use the Service only for lawful purposes. You are responsible for all data, expenses, and information you input into the Service. You must not use the Service to upload, post, or otherwise transmit any material that is unlawful, harmful, threatening, or otherwise objectionable.</p>
            </section>
            
            <section>
              <h2 className="font-bold text-xl text-ink mb-4">4. Limitation of Liability</h2>
              <p>Kaun Dega shall not be liable for any indirect, incidental, special, consequential or exemplary damages resulting from your use of the Service. We do not guarantee the absolute accuracy of user-entered data or settlement calculations, though we strive for mathematical perfection.</p>
            </section>

            <section className="bg-soft-green/30 p-6 rounded-2xl mt-12 border border-soft-green">
              <h2 className="font-bold text-xl text-ink mb-4">Contact Information</h2>
              <p className="mb-4">If you have any questions about these Terms, please contact us at:</p>
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

