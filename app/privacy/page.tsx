import type { Metadata } from "next"

import { Section } from "@/components/layout/section"
import { H1, H3, H4, Body, BodyS } from "@/components/ui/typography"

/*
  Privacy Policy page.

  Content is published verbatim from the client-supplied document
  `docs/Privacy Policy OEML.docx` (Oriental Energy & Minerals Limited). This is a
  faithful transcription: legal wording, defined terms, entity naming ("Oriental
  Energy & Minerals Limited" / "OEML"), lists, obligations, dates, and the contact
  email are preserved exactly. Only web-formatting was applied (headings,
  paragraphs, bullet lists) plus two obvious Word spacing artifacts normalized
  ("...com.Note" -> "...com. Note"; "up tothree" -> "up to three"). No clauses were
  added, removed, or reinterpreted. See the change report for items the client /
  legal should review (e.g. no effective date supplied; the "APPs" reference in a
  Nigeria-scoped section).
*/

export const metadata: Metadata = {
  // Absolute title (bypasses the site's "%s · …" template) to match the exact
  // requested legal-page title using the established company legal name.
  title: { absolute: "Privacy Policy | Oriental Energy and Minerals Limited" },
  description:
    "The Privacy Policy of Oriental Energy and Minerals Limited (OEML): how we collect, hold, use, and disclose your personal information, and how we maintain its quality and security.",
}

/** Shared bullet-list styling for the policy body. */
const listClass =
  "mt-4 list-disc space-y-2 pl-6 text-body text-foreground marker:text-muted-foreground"

export default function PrivacyPolicyPage() {
  return (
    <Section containerWidth="reading" spacing="loose">
      <article>
        <header>
          <H1>Privacy Policy</H1>
          <div className="mt-6 space-y-4">
            <Body>
              Oriental Energy &amp; Minerals Limited (&ldquo;OEML&rdquo;) values
              and respects the privacy of the people we serve and is committed to
              protecting your privacy and complying with all applicable privacy
              laws and regulations.
            </Body>
            <Body>
              This Privacy Policy (<strong>Policy</strong>) describes how we
              collect, hold, use and disclose your personal information, and how
              we maintain the quality and security of your personal information.
            </Body>
          </div>
        </header>

        <div className="mt-12 space-y-10">
          <section>
            <H3 as="h2">What is personal information?</H3>
            <Body className="mt-4">
              &ldquo;Personal information&rdquo; means any information or opinion,
              whether true or not, and whether recorded in a material form or not,
              about an identified individual or an individual who is reasonably
              identifiable. In general terms, this includes information or an
              opinion that personally identifies you either directly or
              indirectly.
            </Body>
          </section>

          <section>
            <H3 as="h2">What personal information do we collect?</H3>
            <Body className="mt-4">
              The personal information we collect about you depends on the nature
              of your dealings with us or what you choose to share with us.
            </Body>
            <Body className="mt-4">
              The personal information we collect about you may include:
            </Body>
            <ul className={listClass}>
              <li>name;</li>
              <li>mailing or street address;</li>
              <li>date of birth;</li>
              <li>email address;</li>
              <li>phone number</li>
            </ul>
            <Body className="mt-4">
              Under certain circumstances, OEML may need to collect sensitive
              information about you. This might include any information or opinion
              about your racial or ethnic origin, political opinions, political
              association, religious or philosophical beliefs, membership of a
              trade union or other professional body, criminal record, or health
              information.
            </Body>
            <Body className="mt-4">
              If we collect your sensitive information, we will do so only with
              your consent, if it is necessary to prevent a serious and imminent
              threat to life or health, or as otherwise required or authorised by
              law, and we take appropriate measures to protect the security of
              this information.
            </Body>
            <Body className="mt-4">
              You do not have to provide us with your personal information. Where
              possible, we will give you the option to interact with us
              anonymously or by using a pseudonym. However, if you choose to deal
              with us in this way or choose not to provide us with your personal
              information, we may not be able to provide you with our services or
              otherwise interact with you.
            </Body>
          </section>

          <section>
            <H3 as="h2">How do we collect your personal information?</H3>
            <Body className="mt-4">
              We collect your personal information directly from you when you:
            </Body>
            <ul className={listClass}>
              <li>interact with us over the phone;</li>
              <li>interact with us in person;</li>
              <li>interact with us online;</li>
              <li>participate in surveys or questionnaires;</li>
              <li>attend an OEML event;</li>
              <li>subscribe to our mailing list;</li>
              <li>
                apply for a position with us as an employee, contractor or
                volunteer;
              </li>
            </ul>
          </section>

          <section>
            <H3 as="h2">Collecting personal information from third parties</H3>
            <Body className="mt-4">
              We may also collect your personal information from third parties or
              through publicly available sources. We collect your personal
              information from these third parties so that we can be well equipped
              to serve you better.
            </Body>
          </section>

          <section>
            <H3 as="h2">How do we use your personal information?</H3>
            <Body className="mt-4">
              We use personal information for many purposes in connection with our
              functions and activities, including the following purposes:
            </Body>
            <ul className={listClass}>
              <li>provide you with information or services that you request from us;</li>
              <li>deliver to you a more personalized experience and service offering;</li>
              <li>improve the quality of the services we offer;</li>
              <li>internal administrative purposes;</li>
              <li>marketing and research purposes;</li>
            </ul>
          </section>

          <section>
            <H3 as="h2">Disclosure of personal information to third parties</H3>
            <Body className="mt-4">
              We may disclose your personal information to third parties in
              accordance with this Policy in circumstances where you would
              reasonably expect us to disclose your information. For example, we
              may disclose your personal information to:
            </Body>
            <ul className={listClass}>
              <li>our third-party service providers (for example, our IT providers);</li>
              <li>our marketing providers;</li>
              <li>our professional services advisors;</li>
            </ul>
          </section>

          <section>
            <H3 as="h2">Transfer of personal information overseas</H3>
            <Body className="mt-4">
              Some of the third-party service providers we disclose personal
              information to may be based in or have servers located outside of
              Nigeria where third parties are located / have servers.
            </Body>
            <Body className="mt-4">
              Where we disclose your personal information to third parties
              overseas, we will take reasonable steps to ensure that data security
              and appropriate privacy practices are maintained. We will only
              disclose to overseas third parties if:
            </Body>
            <ul className={listClass}>
              <li>
                you have given us your consent to disclose personal information to
                that third party;
              </li>
              <li>
                we reasonably believe that:
                <ul className="mt-2 list-[circle] space-y-2 pl-6 marker:text-muted-foreground">
                  <li>
                    the overseas recipient is subject to a law or binding scheme
                    that is, overall, substantially similar to the APPs; and
                  </li>
                  <li>the law or binding scheme can be enforced; or</li>
                </ul>
              </li>
              <li>
                the disclosure is required or authorised by a Nigerian law or
                court / tribunal order.
              </li>
            </ul>
          </section>

          <section>
            <H3 as="h2">How do we protect your personal information?</H3>
            <Body className="mt-4">
              OEML will take reasonable steps to ensure that the personal
              information that we hold about you is kept confidential and secure,
              including by:
            </Body>
            <ul className={listClass}>
              <li>
                having a robust physical security of our premises and databases /
                records;
              </li>
              <li>
                taking measures to restrict access to only personnel who need that
                personal information to effectively provide services to you;
              </li>
              <li>
                having technological measures in place (for example, anti-virus
                software, fire walls);
              </li>
            </ul>
          </section>

          <section>
            <H3 as="h2">Online activity</H3>

            <H4 as="h3" className="mt-6">Cookies</H4>
            <Body className="mt-4">
              This website uses cookies. A cookie is a small file of letters and
              numbers the website puts on your device if you allow it. These
              cookies recognize when your device has visited our website(s)
              before, so we can distinguish you from other users of the website.
              This improves your experience and the OEML website(s).
            </Body>
            <Body className="mt-4">
              We do not use cookies to identify you, just to improve your
              experience on our website(s). If you do not wish to use the cookies,
              you can amend the settings on your internet browser so it will not
              automatically download cookies. However, if you remove or block
              cookies on your computer, please be aware that your browsing
              experience and our website&rsquo;s functionality may be affected.
            </Body>

            <H4 as="h3" className="mt-6">Website analytics</H4>
            <Body className="mt-4">
              Our website uses analytics to help us better understand visitor
              traffic, so we can improve our services. Although this data is mostly
              anonymous, it is possible that under certain circumstances, we may
              connect it to you.
            </Body>
            <Body className="mt-4">
              You may opt-out of receiving marketing communications from us at any
              time.
            </Body>
            <Body className="mt-4">
              In addition, we may also use your personal information or disclose
              your personal information to third parties for the purposes of
              advertising, including online behavioral advertising, website
              personalization, and to provide targeted or retargeted advertising
              content to you (including through third party websites).
            </Body>
          </section>

          <section>
            <H3 as="h2">Retention of personal information</H3>
            <Body className="mt-4">
              We will not keep your personal information for longer than we need
              to. In most cases, this means that we will only retain your personal
              information for the duration of your relationship with us unless we
              are required to retain your personal information to comply with
              applicable laws, for example record-keeping obligations.
            </Body>
          </section>

          <section>
            <H3 as="h2">How to access and correct your personal information</H3>
            <Body className="mt-4">
              OEML will endeavor to keep your personal information accurate,
              complete and up to date.
            </Body>
            <Body className="mt-4">
              If you wish to make a request to access and / or correct the
              personal information we hold about you, you should make a request by
              contacting us and we will usually respond within five (5) working
              days.
            </Body>
          </section>

          <section>
            <H3 as="h2">Links to third-party sites</H3>
            <Body className="mt-4">
              OEML website(s) may contain links to websites operated by third
              parties. If you access a third-party website through our website(s),
              personal information may be collected by that third party website.
              We make no representations or warranties in relation to the privacy
              practices of any third-party provider or website and we are not
              responsible for the privacy policies or the content of any
              third-party provider or website. Third-party providers / websites
              are responsible for informing you about their own privacy practices
              and we encourage you to read their privacy policies.
            </Body>
          </section>

          <section>
            <H3 as="h2">Inquiries and complaints</H3>
            <Body className="mt-4">
              For complaints about how OEML handles, processes or manages your
              personal information, please contact us at{" "}
              <a
                href="mailto:Info@OrientalEML.com"
                className="rounded-sm text-primary underline underline-offset-2 hover:text-primary-hover"
              >
                Info@OrientalEML.com
              </a>
              . Note we may require proof of your identity and full details of
              your request before we can process your complaint.
            </Body>
            <Body className="mt-4">
              Please allow up to three (3) days for OEML to respond to your
              complaint. It will not always be possible to resolve a complaint to
              everyone&rsquo;s satisfaction. If you are not satisfied with our
              response to a complaint, you have the right to contact the
              appropriate higher authority to lodge a complaint.
            </Body>
          </section>

          <section>
            <H3 as="h2">How to contact us</H3>
            <Body className="mt-4">
              If you have a question or concern in relation to our handling of your
              personal information or this Policy, you can contact us for
              assistance as follows:
            </Body>
            <Body className="mt-4">
              <strong>Email</strong>:{" "}
              <a
                href="mailto:Info@OrientalEML.com"
                className="rounded-sm text-primary underline underline-offset-2 hover:text-primary-hover"
              >
                Info@OrientalEML.com
              </a>
            </Body>
          </section>
        </div>

        <BodyS className="mt-12 border-t border-border pt-6 text-muted-foreground">
          &copy; 2026 Oriental Energy &amp; Minerals Limited. All rights reserved.
        </BodyS>
      </article>
    </Section>
  )
}
