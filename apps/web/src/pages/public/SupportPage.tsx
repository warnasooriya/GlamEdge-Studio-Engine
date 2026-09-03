import { LEGAL, LegalLayout, Section } from "./LegalLayout";

export default function SupportPage() {
  return (
    <LegalLayout
      title="Support"
      intro="Help for salon owners using the GlamEdge Owner app, and for clients booking through glamedge.beauty."
    >
      <Section title="Contact us">
        <p>
          Email <a className="text-brand-700 underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> and we will
          get back to you within one business day. Tell us your salon name and, if you are reporting a problem, what
          you were doing when it happened.
        </p>
      </Section>

      <Section title="Signing in">
        <p>
          GlamEdge Owner signs in with your mobile number. Enter it, tap Continue, and we text you a six-digit code
          that is valid for five minutes.
        </p>
        <p>
          If the code does not arrive, check the number you entered, make sure you have signal, and wait a moment
          before requesting another — there is a limit of five requests per ten minutes. If it still does not
          arrive, email us.
        </p>
      </Section>

      <Section title="Waiting for approval">
        <p>
          New salons are reviewed by our team before the dashboard opens, so after your first sign-in you will see a
          "pending approval" screen. We will notify you as soon as your salon is approved. If you have been waiting
          more than one business day, email us.
        </p>
      </Section>

      <Section title="Not receiving booking alerts">
        <p>
          Booking alerts arrive as push notifications. If they stop, check that notifications are enabled for
          GlamEdge Owner in your device Settings, then sign out and back in — that re-registers your device.
        </p>
      </Section>

      <Section title="Billing a client">
        <p>
          Open POS Billing, pick the appointment or add a walk-in, add the services, then choose how the client is
          paying: cash, card, online transfer, LankaQR, or PayPal. Tap Bill &amp; send to raise the invoice and send
          the client a link.
        </p>
      </Section>

      <Section title="Deleting your account">
        <p>
          In the app, go to <strong>Profile → Delete account</strong> and confirm twice. This closes your salon
          account and signs you out on every device. See our{" "}
          <a className="text-brand-700 underline" href="/privacy">Privacy Policy</a> for exactly what is removed and
          what we are required to keep.
        </p>
      </Section>
    </LegalLayout>
  );
}
