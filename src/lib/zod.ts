import { z } from "zod";

// Don't let zod probe for eval-based speed-ups: the CSP forbids eval and would report it.
// Import zod from this module everywhere so the setting always applies first.
z.config({ jitless: true });

export { z };
