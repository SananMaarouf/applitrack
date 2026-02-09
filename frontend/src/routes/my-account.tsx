import { createFileRoute, Navigate } from '@tanstack/react-router'
import { UserProfile, useAuth } from '@clerk/clerk-react'
import { Scale } from 'lucide-react'

export const Route = createFileRoute('/my-account')({
  component: MyAccount,
})

function TermsOfServiceContent() {
  return (
    <div className="max-h-[70vh] overflow-y-auto pr-4">
      <h1 className="text-2xl font-bold mb-4">Applitrack - Terms of Service</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Last updated: May 2025
      </p>
      <p className="mb-4">
        Welcome to Applitrack! These Terms of Service ("Terms") govern your use of our web application, Applitrack ("the Service"). By accessing or using the Service, you agree to these Terms. If you do not agree to these Terms, please do not use the Service.
      </p>

      <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
      <p className="mb-4">
        By using the Service, you agree to be bound by these Terms and our Privacy Policy. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
      </p>

      <h2 className="text-lg font-semibold mb-2">2. Description of Service</h2>
      <p className="mb-4">
        Applitrack is a web-based application that helps users track job applications and their statuses. The Service allows you to organize, monitor, and manage your job search process.
      </p>

      <h2 className="text-lg font-semibold mb-2">3. Account Registration</h2>
      <p className="mb-4">
        To use the Service, you must create an account using a valid email address.
        You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
      </p>

      <h2 className="text-lg font-semibold mb-2">4. Use of the Service</h2>
      <p className="mb-2">
        You agree to use the Service only for lawful purposes and in a manner consistent with these Terms. You may not:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>Use the Service in any way that violates applicable laws or regulations.</li>
        <li>Interfere with or disrupt the operation of the Service.</li>
      </ul>

      <h2 className="text-lg font-semibold mb-2">5. User Data</h2>
      <p className="mb-4">
        Any data you submit to the Service, such as job application information, is stored in our database solely for your use within the Service.
        We do not claim any ownership over your data and will not use it for any purposes outside of providing the Service.
      </p>

      <h2 className="text-lg font-semibold mb-2">6. Privacy</h2>
      <p className="mb-4">
        Your privacy is important to us.
        We don't share, sell, or rent your personal information to third parties.
        When you delete your account, any associated job applications will also be deleted.
        No using your data for nefarious purposes or training AI mumbo jumbo.
      </p>

      <h2 className="text-lg font-semibold mb-2">7. Intellectual Property</h2>
      <p className="mb-4">
        The Service and its original content, features, and functionality are owned by Sanan Maarouf. You may not copy, modify, distribute, or use any part of the Service without our prior written consent.
      </p>

      <h2 className="text-lg font-semibold mb-2">8. Termination</h2>
      <p className="mb-4">
        We reserve the right to terminate or suspend your access to the Service at any time, with or without notice, for any reason, including if we believe you have violated these Terms.
        Basically, if i see that you are doing something shady, i will kick you out.
      </p>

      <h2 className="text-lg font-semibold mb-2">9. Limitation of Liability</h2>
      <p className="mb-4">
        To the maximum extent permitted by law, Sanan Maarouf will not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Service.
      </p>

      <h2 className="text-lg font-semibold mb-2">10. Disclaimer of Warranties</h2>
      <p className="mb-4">
        The Service is provided "as is" and "as available." We make no warranties, whether express or implied, about the Service, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
      </p>

      <h2 className="text-lg font-semibold mb-2">11. Changes to the Terms</h2>
      <p className="mb-4">
        We may update these Terms from time to time. Any changes will be effective upon posting the revised Terms. Your continued use of the Service after the posting of changes constitutes your acceptance of those changes.
      </p>

      <h2 className="text-lg font-semibold mb-2">12. Governing Law</h2>
      <p className="mb-4">
        These Terms are governed by the laws of Norway, without regard to its conflict of law principles.
      </p>

      <h2 className="text-lg font-semibold mb-2">13. Contact Information</h2>
      <p className="mb-4">
        If you have any questions or concerns about these Terms, please contact me at sanan.adnan97@gmail.com
      </p>
    </div>
  )
}

function MyAccount() {
  const { isLoaded, userId } = useAuth()

  if (!isLoaded) return <div>Loading...</div>
  if (!userId) return <Navigate to={'/sign-in' as any} />

  return (
    <div className="mx-auto max-w-4xl">
      <UserProfile routing="path" path="/my-account">
        <UserProfile.Page
          label="Legal"
          url="legal"
          labelIcon={<Scale className="h-4 w-4" />}
        >
          <TermsOfServiceContent />
        </UserProfile.Page>
      </UserProfile>
    </div>
  )
}
