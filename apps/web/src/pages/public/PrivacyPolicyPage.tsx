import { LEGAL, LegalLayout, Section } from "./LegalLayout";

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      intro="How GlamEdge handles information in the GlamEdge booking site and the GlamEdge Owner mobile app."
    >
      <Section title="Who we are">
        <p>
          {LEGAL.legalName} provides salon management software. GlamEdge Owner is the mobile app that salon
          owners and managers use to run their business; glamedge.beauty is the site their clients use to book.
        </p>
        <p>
          You can reach us at <a className="text-brand-700 underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
          {LEGAL.address ? ` Our registered address is ${LEGAL.address}.` : ""}
        </p>
      </Section>

      <Section title="Two kinds of data, two different roles">
        <p>
          <strong>Your salon's data.</strong> When you register a salon we collect information about you and your
          business. For this we are the data controller.
        </p>
        <p>
          <strong>Your clients' data.</strong> When you record a customer, book an appointment, or raise an invoice,
          you are entering information about other people. That data belongs to your salon: you are the controller
          and we host and process it on your instructions. You are responsible for having a lawful basis to record
          it, and for answering your own clients' privacy requests.
        </p>
      </Section>

      <Section title="What we collect">
        <p>
          <strong>Account and business information</strong> — your mobile number, which is how you sign in; your
          name; your salon's name; and optionally your salon's address, contact number, opening hours, logo, and
          PayPal email address for routing payments.
        </p>
        <p>
          <strong>Location</strong> — if you use the map in Profile → Location, the app asks for your device's
          location so you can drop a pin on your salon's address. It is requested only while you are using the app.
          We never collect location in the background, and we store only the resulting salon coordinates.
        </p>
        <p>
          <strong>Photos</strong> — images you choose from your photo library to use as your salon logo, to post to
          your Showcase Feed, or to send to a client in chat. The app only ever reads the specific images you pick.
        </p>
        <p>
          <strong>Business records you create</strong> — services and prices, staff members and their commission
          rates, appointments, invoices and payment method, cash-drawer income and expenses, client records,
          messages, and reviews.
        </p>
        <p>
          <strong>Push notification token</strong> — a device identifier issued by Expo's push service so booking
          alerts reach your phone. It is removed when you sign out.
        </p>
        <p>
          <strong>Technical logs</strong> — IP address and timestamps, kept briefly for security and debugging.
        </p>
      </Section>

      <Section title="What we do not do">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>We do not read your device's contacts, calendar, camera, or microphone.</li>
          <li>
            We do not track you across other companies' apps or websites, and we do not sell or share your data with
            data brokers.
          </li>
          <li>
            We do not handle card or bank numbers in the app. Card, LankaQR, and PayPal payments are completed
            outside GlamEdge by the relevant provider.
          </li>
        </ul>
      </Section>

      <Section title="Why we use it">
        <p>
          Only to run the service: to sign you in, show your bookings, calculate takings and commissions, deliver
          notifications, host the images you post, and support you when you ask. We also use it to keep the service
          secure and to meet our legal and accounting obligations.
        </p>
      </Section>

      <Section title="Who we share it with">
        <p>Service providers, only as far as they need it to operate the app:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Text.lk / Notify.lk</strong> — delivering your sign-in code. Receives your mobile number.</li>
          <li><strong>Expo (Expo Application Services)</strong> — push notifications and app updates. Receives your push token and device type.</li>
          <li><strong>Amazon Web Services</strong> — hosting and image storage. Holds service data and uploaded images.</li>
          <li><strong>PayPal</strong> — payment links you send to clients. Receives the invoice amount and your PayPal email.</li>
          <li><strong>Google Analytics</strong> — aggregate website usage on glamedge.beauty. Not used in the mobile app.</li>
        </ul>
        <p>We disclose data otherwise only where the law requires it.</p>
      </Section>

      <Section title="Where your data is held">
        <p>Our servers are located in {LEGAL.hostingRegion}.</p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep your salon's data for as long as your account is open. When you delete your account we remove or
          anonymize the information that identifies you and your salon.
        </p>
        <p>
          We retain financial records — invoices, cash-drawer entries, and subscription payments — for{" "}
          {LEGAL.financialRetentionYears} years after deletion, because tax and accounting law requires it. These are
          kept detached from your identifying details.
        </p>
      </Section>

      <Section title="Deleting your account">
        <p>
          You can delete your account from inside the GlamEdge Owner app: <strong>Profile → Delete account</strong>.
          You will be asked to confirm twice, and you are then signed out immediately on every device.
        </p>
        <p>
          On deletion we remove your mobile number, your name, your salon's name, address, map location, logo,
          contact number, and PayPal address; we delete your staff members' phone numbers and your pending
          notifications. Financial records are retained as described above, with your identity removed.
        </p>
        <p>
          Client records are not deleted by this action. A client may have booked with other salons on GlamEdge and
          their record is shared between them; your salon simply loses access to it.
        </p>
        <p>
          If you would rather we handled deletion for you, email{" "}
          <a className="text-brand-700 underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, export, or delete your personal
          data, to object to or restrict processing, and to complain to your data protection authority. Most of this
          you can do in the app; for anything else, email us and we will respond within 30 days.
        </p>
      </Section>

      <Section title="Children">
        <p>
          GlamEdge Owner is a business tool and is not directed at children. We do not knowingly collect data from
          anyone under 16.
        </p>
      </Section>

      <Section title="Security">
        <p>
          Sign-in tokens are held in the device keychain. Traffic between the app and our servers uses HTTPS. No
          system is perfectly secure, but we take reasonable technical and organizational measures to protect your
          data.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We will post any update on this page and change the date above. Significant changes will be announced in
          the app.
        </p>
      </Section>
    </LegalLayout>
  );
}
