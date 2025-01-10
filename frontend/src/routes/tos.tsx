import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tos')({
  component: TermsOfService,
})

function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold  mb-6">Applitrack - Terms of Service</h1>
      <p className=" mb-6">
        Last updated: January, 2025
      </p>
      <p className=" mb-6">
        Welcome to Applitrack! These Terms of Service ("Terms") govern your use of our web application, Applitrack ("the Service"). By accessing or using the Service, you agree to these Terms. If you do not agree to these Terms, please do not use the Service.
      </p>

      <h2 className="text-2xl font-semibold  mb-4">1. Acceptance of Terms</h2>
      <p className=" mb-6">
        By using the Service, you agree to be bound by these Terms and our Privacy Policy. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
      </p>

      <h2 className="text-2xl font-semibold  mb-4">2. Description of Service</h2>
      <p className=" mb-6">
        Applitrack is a web-based application that helps users track job applications and their statuses. The Service allows you to organize, monitor, and manage your job search process.
      </p>

      <h2 className="text-2xl font-semibold  mb-4">3. Account Registration</h2>
      <p className=" mb-6">
        To use the Service, you must create an account using a valid email address.
        You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
      </p>

      <h2 className="text-2xl font-semibold  mb-4">4. Use of the Service</h2>
      <p className=" mb-4">
        You agree to use the Service only for lawful purposes and in a manner consistent with these Terms. You may not:
      </p>
      <ul className="list-disc list-inside  mb-6">
        <li>Use the Service in any way that violates applicable laws or regulations.</li>
        <li>Interfere with or disrupt the operation of the Service.</li>
      </ul>

      <h2 className="text-2xl font-semibold  mb-4">5. User Data</h2>
      <p className=" mb-6">
        Any data you submit to the Service, such as job application information, is stored in our database solely for your use within the Service.
        We do not claim any ownership over your data and will not use it for any purposes outside of providing the Service.
        However, we may analyze anonymized and aggregated data to identify trends, such as which companies are hiring or rejecting applications at high rates. 
        This helps us improve the Service and provide insights to users of Applitrack without compromising user privacy.
      </p>

      <h2 className="text-2xl font-semibold  mb-4">6. Privacy</h2>
      <p className=" mb-6">
        Your privacy is important to us.
        We don't share, sell, or rent your personal information to third parties without your consent.
        When you delete your account, we will delete your personal data, including any associated job applications.
        No using your data for nefarious purposes or training AI mumbo jumbo.
        Aggregated and anonymized data (which cannot be traced back to you) may be retained to help us improve the Service.
      </p>

      <h2 className="text-2xl font-semibold  mb-4">7. Intellectual Property</h2>
      <p className=" mb-6">
        The Service and its original content, features, and functionality are owned by Sanan Maarouf. You may not copy, modify, distribute, or use any part of the Service without our prior written consent.
      </p>

      <h2 className="text-2xl font-semibold  mb-4">8. Termination</h2>
      <p className=" mb-6">
        We reserve the right to terminate or suspend your access to the Service at any time, with or without notice, for any reason, including if we believe you have violated these Terms.
        Basically, if i see that you are doing something shady, i will kick you out.
      </p>

      <h2 className="text-2xl font-semibold  mb-4">9. Limitation of Liability</h2>
      <p className=" mb-6">
        To the maximum extent permitted by law, Sanan Maarouf will not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Service.
      </p>

      <h2 className="text-2xl font-semibold  mb-4">10. Disclaimer of Warranties</h2>
      <p className=" mb-6">
        The Service is provided "as is" and "as available." We make no warranties, whether express or implied, about the Service, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
      </p>

      <h2 className="text-2xl font-semibold  mb-4">11. Changes to the Terms</h2>
      <p className=" mb-6">
        We may update these Terms from time to time. Any changes will be effective upon posting the revised Terms. Your continued use of the Service after the posting of changes constitutes your acceptance of those changes.
      </p>

      <h2 className="text-2xl font-semibold  mb-4">12. Governing Law</h2>
      <p className=" mb-6">
        These Terms are governed by the laws of Norway, without regard to its conflict of law principles.
      </p>

      <h2 className="text-2xl font-semibold  mb-4">13. Contact Information</h2>
      <p className=" mb-6">
        If you have any questions or concerns about these Terms, please contact me at sanan.adnan97@gmail.com
      </p>
    </div>
  );
};


