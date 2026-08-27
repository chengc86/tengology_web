# Square checkout (Cheng)

Card payments go through Square. The shop still takes orders without these
keys — they land as **Awaiting payment**. Fill the keys below to charge a
card and mark the order **Paid**.

## 1. Create a Square developer app

1. Open [developer.squareup.com/apps](https://developer.squareup.com/apps) and sign in (or create a developer account).
2. Create an application. Tengology’s prices are **GBP**, so the Square **location** you use must also be GBP. A US sandbox location that settles in USD will decline every charge with a currency mismatch.
3. Open the app and stay on the **Sandbox** toggle until you have taken a real test payment. Switch the same toggle to **Production** only when you go live, and replace every key — do not mix sandbox and production values.

## 2. Copy keys into `.env` / `.env.local` (or the host’s env)

| Variable | Where it lives in Square | Used for |
|---|---|---|
| `SQUARE_ACCESS_TOKEN` | Credentials → Sandbox/Production **Access token** | Server `CreatePayment` / refunds. Never expose this. |
| `SQUARE_ENVIRONMENT` | `"sandbox"` or `"production"` | Must match the token and application id. |
| `SQUARE_LOCATION_ID` | Locations → the GBP location’s id | The account that receives the money. |
| `NEXT_PUBLIC_SQUARE_APPLICATION_ID` | Credentials → **Application ID** | Browser card form (Web Payments SDK). Safe to expose. |
| `NEXT_PUBLIC_SQUARE_LOCATION_ID` | Same location id | Optional. If you leave it blank, checkout uses `SQUARE_LOCATION_ID`. If you set it, it must be the **same** id. |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | Webhooks → subscription → **Signature key** | Verifies `POST /api/webhooks/square`. |
| `SQUARE_WEBHOOK_URL` | The notification URL you registered | Must be **exactly** the URL Square calls, including `https` and any trailing path. Local default: `http://localhost:3001/api/webhooks/square`. |

Checkout is **on** only when `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, and `NEXT_PUBLIC_SQUARE_APPLICATION_ID` are all non-empty. Missing any of them keeps the unpaid fallback.

After changing a `NEXT_PUBLIC_*` value: restart `npm run dev`, or rebuild the production app. Those values are read when the checkout page renders.

## 3. Webhooks (payment state after checkout)

The charge is captured in `placeOrder` and the order is marked paid there. Webhooks cover everything that happens afterwards (or a capture that finishes a moment later):

1. In the Square app → **Webhooks** → add a subscription.
2. URL: production `https://<your-domain>/api/webhooks/square` (or the localhost URL above when testing with a tunnel).
3. Events: `payment.created`, `payment.updated`, `refund.created`, `refund.updated`.
4. Paste the signature key and the **exact** URL into `SQUARE_WEBHOOK_SIGNATURE_KEY` and `SQUARE_WEBHOOK_URL`.

A localhost URL will not receive Square’s events unless you expose it (ngrok, Cloudflare Tunnel, etc.) and register that public URL.

## 4. Take a sandbox payment

1. `npm run dev` (port 3001).
2. Add something to the bag → Checkout. You should see Square’s card fields, not the “card payment isn’t connected” note.
3. Sandbox cards are listed at [developer.squareup.com/docs/devtools/sandbox/payments](https://developer.squareup.com/docs/devtools/sandbox/payments). A typical success case is `4111 1111 1111 1111`, any future expiry, any CVV, any postcode.
4. Submit. The confirmation page should show **Paid**, and the order in admin should have a Square payment id / receipt.

If the card form never appears, the public application id or location id is missing or from the wrong environment. If the form appears but the charge fails, check that the location is GBP and that `SQUARE_ENVIRONMENT` matches the token.

## 5. Production

Repeat the same table with the **Production** toggle: new access token, production application id, production location id, `SQUARE_ENVIRONMENT=production`, and a public https webhook URL. Rotate the sandbox keys out of the host. The production Web Payments script is loaded automatically when `SQUARE_ENVIRONMENT=production`.
