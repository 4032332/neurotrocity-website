/**
 * The text of /beeptest/privacy/, /beeptest/eula/ and /beeptest/support/.
 * Reached through BEEPTEST.docs, so tests/unit/beeptest-copy.test.ts scans it
 * for s5M(8)-banned phrases along with the rest of the copy.
 *
 * Source of truth: beep-test/docs/asc/2026-09-26-policy-audit.md (G1, G2),
 * checked against beep-test App/project.yml usage strings and HealthAccess.swift.
 * Body strings are trusted HTML (inline links and emphasis only). A string
 * array inside `body` renders as a bulleted list.
 */
import { CONTACT } from './facts';
import { REQUIRED_WARNING } from './beeptest-rules';

export type DocBlock = string | readonly string[];
export type DocSection = { readonly h: string; readonly body: readonly DocBlock[] };

const MAIL = `<a href="mailto:${CONTACT.general}">${CONTACT.general}</a>`;
const APPLE_EULA = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY = '<a href="/beeptest/privacy/">privacy policy</a>';

export const LAST_UPDATED = '27 September 2026';

const RISK = [
  REQUIRED_WARNING,
  'It is demanding. Consult a doctor before undertaking strenuous exercise, particularly if you have a heart or respiratory condition, an injury or have not exercised recently. Warm up first, run on a flat non-slip surface, and stop immediately if you feel dizzy, faint, unwell or in pain.',
  'This app is a training aid. It is not medical advice, it does not assess your fitness to take part, and it is not a substitute for the official assessment conducted by a recruiting agency.',
] as const;

const SUBSCRIPTION = [
  'Before the Beep offers an optional paid subscription called <strong>Xtreme Mode</strong>, billed monthly (Xtreme Monthly) or annually (Xtreme Annual). Each comes with a 7-day free trial for eligible new subscribers. The price and billing period are shown in the app before you buy.',
  'Payment is charged to your Apple ID account when you confirm the purchase or, if you start a free trial, when the trial ends. The subscription renews automatically unless it is cancelled at least 24 hours before the end of the current period, and your account is charged for the renewal within the 24 hours before that period ends.',
  'You can manage or cancel your subscription at any time in your Apple account settings (on iPhone: Settings → your name → Subscriptions), or from <strong>Settings → Xtreme Mode → Manage subscription</strong> in the app. Any unused part of a free trial ends when you buy a subscription.',
  'Purchases and refunds are handled by Apple. Nothing in these terms limits your rights under the Australian Consumer Law.',
] as const;

export const PRIVACY_SECTIONS: readonly DocSection[] = [
  {
    h: 'The short version',
    body: [
      'Before the Beep is made by NeuroTrocity, in Australia. The app has no accounts, no servers, no analytics and no advertising. Everything it records stays on your iPhone and Apple Watch. We never receive it.',
      'Our App Store privacy label is “Data Not Collected”, because no data from the app is sent to us or to anyone else.',
    ],
  },
  {
    h: 'What the app keeps on your device',
    body: [
      [
        'Your first name and goal, if you enter them.',
        'Your test results and history.',
        'Your settings.',
        'A record of whether you have used your free test. This is kept in the device keychain, so it survives reinstalling the app.',
      ],
      'None of this leaves your device, and we have no copy of it.',
    ],
  },
  {
    h: 'Apple Health',
    body: [
      'Health access is optional. If you allow it, the app saves each completed test to Apple Health as a workout, with its walking and running distance and active energy. It reads your heart rate and your VO2max so your results and stats are complete.',
      'Health data is used only to log your runs and show your stats. It is never used for advertising or marketing, never sold, and never shared with anyone. The app does not store it in iCloud or on any server.',
      'You can change these permissions at any time in the Health app → Sharing → Apps → Before the Beep. Turning Health off does not stop you running or saving a test.',
    ],
  },
  {
    h: 'Location',
    body: [
      'If you allow it, the app uses your location only while it is open, on iPhone or Apple Watch, to measure your running speed during a free run. Your route is never recorded or stored, and your location never leaves your device. The beep test itself does not use location.',
    ],
  },
  {
    h: 'Camera and photos',
    body: [
      'The camera is used only when you choose to measure a distance on the ground while marking out a course, or to take a photo for your share card. The app can add your share card to your photo library, but it cannot see or read your library. Nothing is uploaded.',
    ],
  },
  {
    h: 'Apple Watch',
    body: [
      'The Apple Watch app exchanges test data directly with your iPhone using Apple’s Watch Connectivity. It goes device to device and never passes through us.',
    ],
  },
  {
    h: 'Purchases',
    body: [
      'Subscriptions are processed by Apple. We receive no payment details or personal information from Apple. The app only learns, on your device, whether a subscription is active.',
    ],
  },
  {
    h: 'Our website and email list',
    body: [
      'This section is about neurotrocity.com, not the app. If you join the Before the Beep email list on our website, your email address is held by our email provider, Buttondown, and used only to tell you about Before the Beep. Every email has an unsubscribe link.',
    ],
  },
  {
    h: 'Access, correction and deletion',
    body: [
      'Because we hold no data from the app, there is nothing for us to access, correct or delete. You can delete everything the app keeps by deleting the app. Health data the app has written can be deleted in the Health app.',
      `For the email list, use the unsubscribe link, or email ${MAIL} and we will remove your address.`,
    ],
  },
  {
    h: 'Children',
    body: ['The app is not directed at children under 13.'],
  },
  {
    h: 'Australian Privacy Principles',
    body: [
      'We handle personal information in line with the Australian Privacy Principles in the <em>Privacy Act 1988</em> (Cth). Health information is sensitive information, which is one reason the app keeps it on your device and never sends it to us.',
      `To ask a question or make a complaint about privacy, email ${MAIL}. We will respond within 30 days. If you are not satisfied with our response, you can contact the Office of the Australian Information Commissioner at <a href="https://www.oaic.gov.au/">oaic.gov.au</a>.`,
    ],
  },
  {
    h: 'Changes',
    body: ['If this policy changes, we will post the new version here and update the date at the top.'],
  },
];

export const EULA_SECTIONS: readonly DocSection[] = [
  {
    h: 'Licence',
    body: [
      `Before the Beep is licensed to you under Apple’s <a href="${APPLE_EULA}">Standard Licensed Application End User Licence Agreement</a> (the Apple standard EULA). NeuroTrocity is the licensor.`,
      'The terms below are supplemental terms. They add to the Apple standard EULA and do not replace it.',
    ],
  },
  { h: 'Subscription terms', body: SUBSCRIPTION },
  { h: 'Risk warning', body: RISK },
  {
    h: 'Contact',
    body: [`Questions about these terms go to ${MAIL}. How the app handles your information is set out in our ${PRIVACY}.`],
  },
];

export const SUPPORT_SECTIONS: readonly DocSection[] = [
  {
    h: 'Get help',
    body: [
      `Email ${MAIL}. A person reads it and replies. There is no ticket queue and no bot.`,
      'It helps to include your iPhone model and iOS version, your Apple Watch model and watchOS version if the watch was involved, the app version, and what you were doing and what happened instead.',
    ],
  },
  {
    h: 'How do I restore my purchase?',
    body: [
      'Open the subscription screen in the app and tap <strong>Restore purchases</strong>. Use the same Apple ID you subscribed with. This is also what to do on a new phone.',
    ],
  },
  {
    h: 'How do I cancel my subscription?',
    body: [
      'In the app, go to <strong>Settings → Xtreme Mode → Manage subscription</strong>, or on iPhone go to Settings → your name → Subscriptions → Before the Beep. Cancel at least 24 hours before the end of the current period, or it renews automatically. Refunds are handled by Apple at <a href="https://reportaproblem.apple.com/">reportaproblem.apple.com</a>.',
    ],
  },
  {
    h: 'What does the app do with Apple Health?',
    body: [
      'Health access is optional. If you allow it, the app saves each completed test as a workout with its distance and active energy, and reads your heart rate and VO2max for your stats. Nothing is sent to us.',
      'To change it, open the Health app → Sharing → Apps → Before the Beep. Saying no does not stop you running or saving a test.',
    ],
  },
  {
    h: 'How do I turn strong language off?',
    body: ['Go to <strong>Settings</strong> in the app and switch <strong>Strong language</strong> off. You can switch it back on the same way.'],
  },
  {
    h: 'Does it work on Apple Watch?',
    body: [
      'Yes. Before the Beep has an Apple Watch app that works with the iPhone app, and the two exchange your test data directly with each other.',
    ],
  },
  {
    h: 'Where is my data?',
    body: [
      `On your device. There is no account and no server, and nothing is sent to us. Deleting the app deletes your history with it. Full detail is in the ${PRIVACY}.`,
    ],
  },
  { h: 'Before you run', body: RISK },
  {
    h: 'Policies',
    body: [[`<a href="/beeptest/privacy/">Privacy policy</a>`, `<a href="/beeptest/eula/">Licence agreement (EULA)</a>`]],
  },
];
