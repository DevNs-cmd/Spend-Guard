// POST /billing/webhook — verifies Stripe signature, updates subscription state.
import { Controller, Post } from "@nestjs/common";

@Controller("billing/webhook")
export class StripeWebhookController {
  @Post()
  handle() {
    // TODO
  }
}
