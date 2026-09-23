import type { Metadata } from "next"

import { Section } from "@/components/layout/section"
import { H1, H3, H4, Body, BodyS } from "@/components/ui/typography"

/*
  Terms of Service page.

  Content is published verbatim from the client-approved document
  `docs/OEML - Website Terms Conditions - Privacy Policy - DRAFT - September 22
  2026.docx` (Terms of Service section). This is a faithful transcription: the
  21 sections and their subsection numbering, headings, ordered/bulleted lists,
  legal wording, defined terms, entity naming, dates, and the contact details
  are preserved exactly. Only web-presentation formatting was applied (headings,
  paragraphs, lists, spacing, and in-page anchor links for the table of
  contents, since the source TOC linked to an external template URL). No clauses
  were added, removed, or reinterpreted.
*/

export const metadata: Metadata = {
  title: { absolute: "Terms & Conditions | Oriental Energy and Minerals Limited" },
  description:
    "The Terms of Service of Oriental Energy and Minerals Limited (OEML): definitions, use of our services, pricing, delivery, liability, dispute resolution, and contact information.",
}

const listClass =
  "mt-4 list-disc space-y-2 pl-6 text-body text-foreground marker:text-muted-foreground"

/** Table of contents: section number → heading (anchors to #s{n}). */
const toc: { n: number; title: string }[] = [
  { n: 1, title: "Definitions and Interpretation" },
  { n: 2, title: "Acceptance of Terms" },
  { n: 3, title: "Description of Services" },
  { n: 4, title: "User Accounts and Registration" },
  { n: 5, title: "User Responsibilities and Obligations" },
  { n: 6, title: "Service Availability and Limitations" },
  { n: 7, title: "Pricing and Payment Terms" },
  { n: 8, title: "Delivery Terms and Conditions" },
  { n: 9, title: "Liability and Risk Allocation" },
  { n: 10, title: "Intellectual Property Rights" },
  { n: 11, title: "Prohibited Uses" },
  { n: 12, title: "Marketplace and Matching Mechanics" },
  { n: 13, title: "Envoy Terms" },
  { n: 14, title: "Ratings, Reviews and Account Standing" },
  { n: 15, title: "Indemnification" },
  { n: 16, title: "App Store Compliance" },
  { n: 17, title: "Termination" },
  { n: 18, title: "Dispute Resolution and Governing Law" },
  { n: 19, title: "Force Majeure" },
  { n: 20, title: "Modifications to Terms" },
  { n: 21, title: "Contact Information" },
]

export default function TermsPage() {
  return (
    <Section containerWidth="reading" spacing="loose">
      <article>
        <header>
          <H1>Terms of Service</H1>
          <BodyS className="mt-4 text-muted-foreground">
            Effective September 20, 2026
          </BodyS>
        </header>

        {/* Table of contents (in-page anchors). */}
        <nav aria-label="Table of contents" className="mt-8">
          <ol className="space-y-2 text-body">
            {toc.map((s) => (
              <li key={s.n}>
                <a
                  href={`#s${s.n}`}
                  className="rounded-sm text-primary underline underline-offset-2 hover:text-primary-hover"
                >
                  {s.n}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-12 space-y-10">
          {/* 1 */}
          <section id="s1">
            <H3 as="h2">1. Definitions and Interpretation</H3>
            <Body className="mt-4">
              In these Terms of Service, the following definitions apply:
            </Body>
            <ul className={listClass}>
              <li>
                <strong>
                  &ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo;
                </strong>{" "}
                or <strong>&ldquo;our&rdquo;</strong> refers to Oriental Energy
                &amp; Minerals Limited (&ldquo;OEML&rdquo;), a company
                incorporated under the laws of the Federal Republic of Nigeria.
              </li>
              <li>
                <strong>
                  &ldquo;User,&rdquo; &ldquo;you,&rdquo;
                </strong>{" "}
                or <strong>&ldquo;your&rdquo;</strong> refers to any individual
                or entity that accesses or uses our Services.
              </li>
              <li>
                <strong>&ldquo;Services&rdquo;</strong> refers to the aggregation
                of physical commodities from reviewed suppliers and the
                coordinated inspection, freight, and origin logistics through to
                vetted corporate and institutional buyers, and related services
                provided by OEML advertised through our mobile application,
                website, or other platforms.
              </li>
              <li>
                <strong>&ldquo;Platform&rdquo;</strong> refers to our mobile
                applications, website (
                <a
                  href="http://www.OrientalEML.com"
                  className="rounded-sm text-primary underline underline-offset-2 hover:text-primary-hover"
                >
                  www.OrientalEML.com
                </a>
                ), and any other digital interfaces through which our Services
                are accessed.
              </li>
              <li>
                <strong>&ldquo;Customer&rdquo;</strong> refers to registered
                business or individual users who book or utilize our stated
                services.
              </li>
              <li>
                <strong>&ldquo;Consignment&rdquo;</strong> refers to commodities,
                goods, packages, or items tendered for delivery through our
                Services.
              </li>
              <li>
                <strong>&ldquo;Delivery Address&rdquo;</strong> refers to the
                final destination where a Consignment is to be delivered.
              </li>
              <li>
                <strong>&ldquo;Force Majeure&rdquo;</strong> refers to
                circumstances beyond our reasonable control including but not
                limited to acts of God, war, terrorism, civil unrest, government
                actions, natural disasters, or pandemic conditions.
              </li>
              <li>
                <strong>&ldquo;Order&rdquo;</strong> refers to a contracted
                service request placed by a Customer and accepted by OEML for
                fulfillment. OEML is licensed to mine and aggregate commercially
                viable occurrences of:
                <ul className="mt-2 list-[circle] space-y-1 pl-6 marker:text-muted-foreground">
                  <li>Copper Cathode</li>
                  <li>Gold</li>
                  <li>Lithium (EV batteries)</li>
                  <li>Columbite-Tantalite (Coltan)</li>
                  <li>Tin</li>
                  <li>Lead-Zinc</li>
                  <li>Manganese</li>
                  <li>Rare Earth Elements (REE)</li>
                  <li>Barite</li>
                  <li>Bitumen</li>
                  <li>Iron ore</li>
                  <li>Crude Oil</li>
                </ul>
              </li>
              <li>
                <strong>&ldquo;Rate Card&rdquo;</strong> refers to the schedule
                of fees, commissions, cancellation charges, and payout rates
                published by OEML from time to time, as updated with reasonable
                notice.
              </li>
              <li>
                <strong>
                  &ldquo;COD&rdquo; or &ldquo;Cash on Delivery&rdquo;
                </strong>{" "}
                refers to amounts collected by OEML on behalf of a Customer in
                connection with an order.
              </li>
            </ul>
          </section>

          {/* 2 */}
          <section id="s2">
            <H3 as="h2">2. Acceptance of Terms</H3>
            <Body className="mt-4">
              By accessing, registering for, or using any of our Services, you
              acknowledge that you have read, understood, and agree to be bound
              by these Terms of Service and our Privacy Policy. If you do not
              agree to these terms, you must not use our Services.
            </Body>
            <Body className="mt-4">
              These Terms constitute a legally binding agreement between you and
              OEML. Your continued use of our Services following any
              modifications to these Terms will constitute your acceptance of
              such modifications.
            </Body>
            <Body className="mt-4">
              You represent and warrant that you have the legal authority to
              enter into this agreement on behalf of yourself or the entity you
              represent, and that you are at least 18 years of age or have
              reached the age of majority in your jurisdiction.
            </Body>
          </section>

          {/* 3 */}
          <section id="s3">
            <H3 as="h2">3. Description of Services</H3>
            <Body className="mt-4">
              A licensed mineral aggregator connecting physical commodity supply
              with vetted demand. OEML services consist of aggregating physical
              commodities from reviewed suppliers and coordinating inspection,
              freight, and origin logistics through to vetted corporate and
              institutional buyers. As the aggregator, OEML will mediate between
              the reviewed supply and vetted demand, coordinating review,
              inspection, documentation, and origin logistics. Present a supply
              position to a reviewed, inspected process, without exposing your
              material to a public market.
            </Body>
          </section>

          {/* 4 */}
          <section id="s4">
            <H3 as="h2">4. User Accounts and Registration</H3>
            <Body className="mt-4">
              To access our Services, you must create an account by providing
              accurate, complete, and current information. You are responsible
              for maintaining the confidentiality of your account credentials and
              for all activities that occur under your account.
            </Body>
            <Body className="mt-4">You agree to:</Body>
            <ul className={listClass}>
              <li>
                Provide true, accurate, current, and complete information during
                registration
              </li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and identification</li>
              <li>
                Notify us immediately of any unauthorized use of your account
              </li>
              <li>Accept all responsibility for all activities under your account</li>
            </ul>
            <Body className="mt-4">
              We reserve the right to suspend or terminate accounts that provide
              false information or violate these Terms.
            </Body>
          </section>

          {/* 5 */}
          <section id="s5">
            <H3 as="h2">5. User Responsibilities and Obligations</H3>
            <Body className="mt-4">
              As a user of our Services, you agree to:
            </Body>

            <H4 as="h3" className="mt-6">5.1 Consignment Requirements</H4>
            <ul className={listClass}>
              <li>Provide accurate and complete information about all Consignments</li>
              <li>Ensure proper packaging to prevent damage during transit</li>
              <li>Declare the contents, value, and any special handling requirements</li>
              <li>Comply with all applicable laws regarding the shipment of goods</li>
              <li>Not tender prohibited or restricted items for delivery</li>
            </ul>

            <H4 as="h3" className="mt-6">5.2 Payment Obligations</H4>
            <ul className={listClass}>
              <li>Pay all fees and charges in accordance with our pricing schedule</li>
              <li>Provide valid payment information and maintain sufficient funds</li>
              <li>Pay any additional charges for special services or circumstances</li>
              <li>Settle any outstanding amounts within the specified time period</li>
            </ul>

            <H4 as="h3" className="mt-6">5.3 Compliance Requirements</H4>
            <ul className={listClass}>
              <li>Comply with all applicable Nigerian and international laws</li>
              <li>Respect the intellectual property rights of others</li>
              <li>Not use our Services for any unlawful or fraudulent purposes</li>
              <li>Cooperate with any reasonable investigations or requests</li>
            </ul>
          </section>

          {/* 6 */}
          <section id="s6">
            <H3 as="h2">6. Service Availability and Limitations</H3>
            <Body className="mt-4">
              While we strive to provide reliable services, we cannot guarantee
              uninterrupted availability. Our Services may be subject to
              limitations, delays, or interruptions due to:
            </Body>
            <ul className={listClass}>
              <li>Maintenance, upgrades, or technical issues</li>
              <li>Weather conditions or natural disasters</li>
              <li>Traffic, road conditions, or infrastructure limitations</li>
              <li>Security concerns or government restrictions</li>
              <li>Force Majeure events beyond our control</li>
            </ul>
            <Body className="mt-4">
              We reserve the right to modify, suspend, or discontinue any aspect
              of our Services at any time with reasonable notice.
            </Body>
          </section>

          {/* 7 */}
          <section id="s7">
            <H3 as="h2">7. Pricing and Payment Terms</H3>

            <H4 as="h3" className="mt-6">7.1 Pricing Structure</H4>
            <Body className="mt-4">
              Our pricing is based on factors including but not limited to:
            </Body>
            <ul className={listClass}>
              <li>London Metal Exchange (LME)</li>
              <li>LBMA Precious Metal Pricing</li>
              <li>Mineral type, grade, weight, dimensions, and location</li>
              <li>Delivery distance and destination</li>
              <li>Service type and delivery timeframe</li>
              <li>Additional services requested</li>
            </ul>

            <H4 as="h3" className="mt-6">7.2 Payment Terms</H4>
            <ul className={listClass}>
              <li>
                Payment terms are negotiated and agreed prior to and on a
                case-by-case basis
              </li>
              <li>We accept payments through prior approved payment methods</li>
              <li>
                Some online account features customers may be billed monthly or
                as agreed
              </li>
              <li>Late payments may incur additional charges and service suspension</li>
            </ul>
          </section>

          {/* 8 */}
          <section id="s8">
            <H3 as="h2">8. Delivery Terms and Conditions</H3>

            <H4 as="h3" className="mt-6">8.1 Delivery Timeframes</H4>
            <Body className="mt-4">
              Delivery timeframes are estimates based on normal operating
              conditions. Actual delivery times may vary due to factors beyond
              our control. We will make reasonable efforts to meet estimated
              delivery times but do not guarantee specific delivery times outside
              of what is contracted.
            </Body>

            <H4 as="h3" className="mt-6">8.2 Delivery Locations</H4>
            <Body className="mt-4">
              We provide delivery services to accessible addresses within our
              global service areas. Additional charges may apply for:
            </Body>
            <ul className={listClass}>
              <li>Remote or difficult-to-access locations</li>
              <li>Deliveries requiring special equipment or handling</li>
              <li>Multiple delivery attempts</li>
              <li>Weekend or holiday deliveries</li>
            </ul>
          </section>

          {/* 9 */}
          <section id="s9">
            <H3 as="h2">9. Liability and Risk Allocation</H3>

            <H4 as="h3" className="mt-6">9.1 Limitation of Liability</H4>
            <Body className="mt-4">
              Liability limitations are negotiated and agreed prior to and on a
              case-by-case basis, to the maximum extent permitted by Nigerian
              law.
            </Body>

            <H4 as="h3" className="mt-6">9.2 Excluded Damages</H4>
            <Body className="mt-4">We shall not be liable for:</Body>
            <ul className={listClass}>
              <li>Indirect, consequential, or incidental damages</li>
              <li>Loss of profits, revenue, or business opportunities</li>
              <li>Delays beyond our reasonable control</li>
              <li>Damage due to inadequate packaging by the sender</li>
              <li>Loss or damage to prohibited items</li>
              <li>
                Acts or omissions of third parties, including envoys/riders
                acting outside the scope of an accepted delivery
              </li>
            </ul>

            <H4 as="h3" className="mt-6">9.3 Insurance and Protection</H4>
            <Body className="mt-4">
              Basic liability protection is included for eligible orders, and
              enhanced or expand insurance coverage is available on a
              case-by-case basis upon request which may require the payment of
              additional premiums.
            </Body>
          </section>

          {/* 10 */}
          <section id="s10">
            <H3 as="h2">10. Intellectual Property Rights</H3>
            <Body className="mt-4">
              All intellectual property rights in our Platform, Services,
              technology, and materials are owned by or licensed to OEML. This
              includes but is not limited to:
            </Body>
            <ul className={listClass}>
              <li>Trademarks, service marks, and trade names</li>
              <li>Copyrights in software, content, and materials</li>
              <li>Trade secrets and proprietary processes</li>
              <li>Patents and patent applications</li>
            </ul>
            <Body className="mt-4">
              You are granted a limited, non-exclusive, non-transferable license
              to use our Platform solely for accessing our Services. You may not
              reproduce, distribute, modify, or create derivative works without
              our express written consent.
            </Body>
          </section>

          {/* 11 */}
          <section id="s11">
            <H3 as="h2">11. Prohibited Uses</H3>
            <Body className="mt-4">
              You may not use our Services for shipping or handling:
            </Body>
            <ul className={listClass}>
              <li>Illegal drugs, controlled substances, or narcotics</li>
              <li>Weapons, ammunition, or explosive materials</li>
              <li>Hazardous, toxic, or dangerous materials</li>
              <li>Items prohibited by Nigerian customs or international law</li>
              <li>Stolen goods or items obtained through fraud</li>
              <li>Live animals (except with prior approval)</li>
              <li>Perishable items without appropriate arrangements</li>
              <li>Items that violate intellectual property rights</li>
              <li>Currency, securities, or negotiable instruments</li>
              <li>
                Items with a value exceeding our standard limits without
                declaration.
              </li>
            </ul>
            <Body className="mt-4">You also may not use our Platform to:</Body>
            <ul className={listClass}>
              <li>Violate any applicable laws or regulations</li>
              <li>Interfere with or disrupt our Services or servers</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Transmit malware, viruses, or harmful code</li>
              <li>Engage in fraudulent or deceptive practices</li>
            </ul>
          </section>

          {/* 12 */}
          <section id="s12">
            <H3 as="h2">12. Marketplace and Matching Mechanics</H3>

            <H4 as="h3" className="mt-6">12.1 Platform Nature</H4>
            <Body className="mt-4">
              OEML operates a technology platform as an aggregator operating
              between buyers and sellers of minerals to review, inspect,
              document, and coordinate courier logistics. OEML deliveries are
              performed by independent contractors, and the contract for the
              carriage of each Consignment is between the Customer and the envoy
              who accepts the delivery, with OEML acting as facilitator, dispatch
              coordinator, and payment collection agent.
            </Body>
          </section>

          {/* 13 */}
          <section id="s13">
            <H3 as="h2">13. Envoy Terms</H3>
            <Body className="mt-4">
              This Section applies to all envoys who register on or use Envoy, in
              addition to the remainder of these Terms.
            </Body>

            <H4 as="h3" className="mt-6">13.1 Background Checks and Verification</H4>
            <Body className="mt-4">
              By registering to work or contract with OEML, you consent to OEML
              conducting identity verification and background checks, which may
              include criminal history checks (where legally permitted), license
              validation, and verification of vehicle documents. Such checks are
              carried out in accordance with the Nigeria Data Protection Act 2023
              and our Privacy Policy. We may suspend or decline your application
              based on the outcome of these checks, in our reasonable discretion.
            </Body>

            <H4 as="h3" className="mt-6">13.2 Independent Contractor Status</H4>
            <Body className="mt-4">
              Couriers and other staff who work for OEML are independent
              contractors, not employees, agents, or partners of OEML. Nothing in
              these Terms creates an employment relationship. As an independent
              contractor, you:
            </Body>
            <ul className={listClass}>
              <li>
                Determine your own working hours and availability, subject to
                accepting deliveries offered
              </li>
              <li>
                Are responsible for your own tax obligations, including
                remittance of any applicable taxes on earnings
              </li>
              <li>
                Are responsible for your own vehicle maintenance, fuel, and
                operating costs unless otherwise agreed
              </li>
              <li>
                Are not entitled to employee benefits (leave, pension
                contributions, etc.) from OEML
              </li>
            </ul>
            <Body className="mt-4">
              The parties intend this relationship to be one of independent
              contract, and each envoy waives any claim to employee status,
              benefits, or entitlements under Nigerian labor law to the fullest
              extent permitted by law.
            </Body>
          </section>

          {/* 14 */}
          <section id="s14">
            <H3 as="h2">14. Ratings, Reviews and Account Standing</H3>

            <H4 as="h3" className="mt-6">14.1 Mutual Ratings</H4>
            <Body className="mt-4">
              After each completed delivery, customers may rate and review the
              envoy, and envoys may rate the customer, through the Platform.
              Ratings must be honest, lawful, and free of abuse.
            </Body>

            <H4 as="h3" className="mt-6">14.2 Effect on Account Standing</H4>
            <Body className="mt-4">
              Persistently low ratings, repeated complaints, safety incidents, or
              cancellation patterns may result in warnings, reduced access to
              deliveries or bookings, suspension, or deactivation of the relevant
              account, following our standard review process.
            </Body>

            <H4 as="h3" className="mt-6">14.3 Disputing a Rating or Deactivation</H4>
            <Body className="mt-4">
              Any user may dispute a rating, suspension, or deactivation decision
              by contacting our support team within fourteen (14) days of
              notification, with supporting evidence. We will review the dispute
              and communicate the outcome within a reasonable time. A deactivated
              envoy may submit one formal appeal per deactivation; reinstatement
              is at OEML&rsquo;s reasonable discretion. Pending the outcome of any
              dispute or appeal, the contested decision remains in effect.
            </Body>
          </section>

          {/* 15 */}
          <section id="s15">
            <H3 as="h2">15. Indemnification</H3>
            <Body className="mt-4">
              To the maximum extent permitted by Nigerian law, you agree to
              indemnify, defend, and hold harmless OEML, its directors, officers,
              employees, and agents from and against any and all claims, demands,
              liabilities, damages, losses, fines, and expenses (including
              reasonable legal fees) arising out of or in connection with:
            </Body>
            <ul className={listClass}>
              <li>
                Your breach of these Terms or of any representation or warranty
                made under them;
              </li>
              <li>
                Your violation of any applicable law or regulation, or of the
                rights of any third party;
              </li>
              <li>
                In the case of envoys: the operation of your vehicle, your
                performance or non-performance of deliveries, your handling of
                Consignments, and your collection, handling, or remittance of COD
                funds;
              </li>
              <li>
                In the case of Customers: the contents, packaging, or declared
                value of Consignments you tender, and any instructions you
                provide in connection with them.
              </li>
            </ul>
            <Body className="mt-4">
              This indemnification obligation survives the termination or expiry
              of these Terms and the closure of your account.
            </Body>
          </section>

          {/* 16 */}
          <section id="s16">
            <H3 as="h2">16. App Store Compliance</H3>
            <Body className="mt-4">
              Our Envoy and Voyager applications are distributed through the Apple
              App Store and Google Play Store. Your download and use of either
              application is also subject to the applicable app store&rsquo;s
              terms of service (including the Apple Media Services Terms and
              Conditions and the Google Play Terms of Service). The applications
              are licensed to you, not sold. As between you and OEML, these Terms
              prevail in the event of any conflict with app store terms; however,
              OEML, and not the app store operator, is solely responsible for the
              applications and their content, and the app store operators have no
              obligation to provide maintenance, support, or refunds in respect
              of the applications except as required by their own terms or
              applicable law.
            </Body>
          </section>

          {/* 17 */}
          <section id="s17">
            <H3 as="h2">17. Termination</H3>

            <H4 as="h3" className="mt-6">17.1 Termination by You</H4>
            <Body className="mt-4">
              You may terminate your account at any time by contacting our
              customer service or through your account settings. Upon
              termination, you remain responsible for all outstanding charges and
              obligations.
            </Body>

            <H4 as="h3" className="mt-6">17.2 Termination by Us</H4>
            <Body className="mt-4">
              We may suspend or terminate your account immediately without notice
              if:
            </Body>
            <ul className={listClass}>
              <li>You violate these Terms of Service</li>
              <li>You engage in fraudulent or illegal activities</li>
              <li>Your account remains inactive for an extended period</li>
              <li>You fail to pay outstanding charges</li>
              <li>
                We determine that continued service would be harmful to our
                business or other users
              </li>
            </ul>
            <Body className="mt-4">
              envoy accounts may additionally be suspended or deactivated in
              accordance with Sections 12, 13, and 14.
            </Body>

            <H4 as="h3" className="mt-6">17.3 Effect of Termination</H4>
            <Body className="mt-4">Upon termination:</Body>
            <ul className={listClass}>
              <li>Your access to our Services will be discontinued</li>
              <li>We will complete any deliveries already in progress</li>
              <li>Outstanding charges become immediately due</li>
              <li>Stored data may be deleted after a reasonable notice period</li>
              <li>
                Provisions regarding liability, indemnification, intellectual
                property, and dispute resolution survive termination
              </li>
            </ul>
          </section>

          {/* 18 */}
          <section id="s18">
            <H3 as="h2">18. Dispute Resolution and Governing Law</H3>

            <H4 as="h3" className="mt-6">18.1 Governing Law</H4>
            <Body className="mt-4">
              These Terms of Service are governed by and construed in accordance
              with the laws of the Federal Republic of Nigeria. Any disputes
              arising under these Terms shall be subject to the exclusive
              jurisdiction of the Nigerian courts.
            </Body>

            <H4 as="h3" className="mt-6">18.2 Dispute Resolution Process</H4>
            <Body className="mt-4">
              Before initiating formal legal proceedings, parties agree to attempt
              resolution through:
            </Body>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-body text-foreground marker:text-muted-foreground">
              <li>
                <strong>Direct Negotiation:</strong> Good faith discussions
                between the parties
              </li>
              <li>
                <strong>Mediation:</strong> Non-binding mediation through a
                mutually agreed mediator
              </li>
              <li>
                <strong>Arbitration:</strong> Binding arbitration seated in Abuja,
                Nigeria, under the Arbitration and Mediation Act 2023 of the
                Federal Republic of Nigeria. The arbitral award shall be final and
                binding and may be enforced in any court of competent
                jurisdiction.
              </li>
            </ol>

            <H4 as="h3" className="mt-6">18.3 Compliance with Regulations</H4>
            <Body className="mt-4">
              OEML is committed to adhering to all relevant financial, banking,
              data protection, and privacy regulations. We diligently balance our
              responsibilities in governmental and corporate governance while
              assuring our institutional investors and global regulators of our
              unwavering ethical standards. Our organization prioritizes
              credibility and transparency in our interactions with clients,
              governmental authorities, and financial stakeholders.
            </Body>
          </section>

          {/* 19 */}
          <section id="s19">
            <H3 as="h2">19. Force Majeure</H3>
            <Body className="mt-4">
              Neither party shall be liable for any failure or delay in
              performance under these Terms which is due to an event of Force
              Majeure. Upon occurrence of such an event, the affected party shall:
            </Body>
            <ul className={listClass}>
              <li>Promptly notify the other party of the Force Majeure event</li>
              <li>Use reasonable efforts to mitigate the effects of the event</li>
              <li>Resume performance as soon as reasonably possible</li>
            </ul>
            <Body className="mt-4">
              If a Force Majeure event continues for more than 30 days, either
              party may terminate the affected Services upon written notice.
            </Body>
          </section>

          {/* 20 */}
          <section id="s20">
            <H3 as="h2">20. Modifications to Terms</H3>
            <Body className="mt-4">
              We reserve the right to modify these Terms of Service at any time.
              Significant changes will be communicated through:
            </Body>
            <ul className={listClass}>
              <li>Email notifications to registered users</li>
              <li>Prominent notices on our Platform</li>
              <li>Push notifications through our mobile applications</li>
              <li>WhatsApp messages to active customers</li>
            </ul>
            <Body className="mt-4">
              Continued use of our Services after the effective date of
              modifications constitutes acceptance of the revised Terms.
            </Body>
          </section>

          {/* 21 */}
          <section id="s21">
            <H3 as="h2">21. Contact Information</H3>
            <Body className="mt-4">
              For questions, concerns, or disputes regarding these Terms of
              Service, please contact us:
            </Body>
            <ul className={listClass}>
              <li>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:Info@OrientalEML.com"
                  className="rounded-sm text-primary underline underline-offset-2 hover:text-primary-hover"
                >
                  Info@OrientalEML.com
                </a>
              </li>
              <li>
                <strong>Phone:</strong> Not yet - XXXXXXXXXXX
              </li>
              <li>
                <strong>WhatsApp:</strong> Available through our customer service
              </li>
              <li>
                <strong>Website:</strong>{" "}
                <a
                  href="http://www.OrientalEML.com"
                  className="rounded-sm text-primary underline underline-offset-2 hover:text-primary-hover"
                >
                  www.OrientalEML.com
                </a>
              </li>
            </ul>
            <Body className="mt-4">
              This document was last updated on September 14, 2026. For the most
              current version, please visit{" "}
              <a
                href="http://www.OrientalEML.com"
                className="rounded-sm text-primary underline underline-offset-2 hover:text-primary-hover"
              >
                www.OrientalEML.com
              </a>
              .
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
