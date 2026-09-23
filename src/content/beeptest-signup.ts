/**
 * The launch list's form action.
 *
 * Buttondown's docs: the embed-subscribe endpoint "must be the action of a
 * standard HTML <form>. Do not send requests to it with JavaScript's fetch
 * API: subscribers sometimes need to follow Buttondown's response to complete
 * CAPTCHA verification or correct a validation error."
 * https://docs.buttondown.com/building-your-subscriber-base
 *
 * So this returns a URL for a plain <form action>, and nothing on the page
 * ever fetches it.
 */
export function buttondownAction(username: string | null): string | null {
  if (username === null) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(username)) {
    throw new Error(
      `Buttondown username "${username}" is not a bare username. ` +
        'Paste only the part after /embed-subscribe/, not the whole URL.',
    );
  }
  return `https://buttondown.com/api/emails/embed-subscribe/${username}`;
}
