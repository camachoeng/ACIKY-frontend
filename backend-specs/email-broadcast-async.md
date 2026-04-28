# Email Broadcast — Async Send to Avoid Heroku Timeout

## Problem
Heroku kills requests after 30 seconds (H12 timeout). Sending 44+ emails synchronously takes longer than 30s. When Heroku kills the connection mid-response, the error reply has no CORS headers, so the browser shows a CORS error instead of a real error message.

## Required Change

In `emailController.broadcast` (or wherever the broadcast handler lives), change the flow from:

**Current (sync):**
1. Get recipients
2. Send all emails (await each one)
3. Return `{ sent, errors }`

**New (async):**
1. Get recipients list
2. Respond immediately with `{ queued: recipients.length }`
3. Send all emails in the background using `setImmediate` (fire-and-forget)

The Node.js process keeps running after `res.json()` is called as long as async work is pending, so the emails will still be delivered.

## Implementation Notes

- Use `setImmediate(() => { /* send loop */ })` after `res.json({ queued: recipients.length })`
- The send loop can still log errors internally (console.error) even though the client won't see them
- No need to track sent/errors count since we won't return it to the client
- If the send loop is already extracted into a service function (e.g. `emailService.sendBroadcast(recipients, ...)`), just call it without awaiting after responding

## Response Format Change

Before: `{ sent: 44, errors: 0 }`
After: `{ queued: 44 }`

The frontend already handles both formats.
