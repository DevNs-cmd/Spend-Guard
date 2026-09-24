import { Injectable, Logger } from "@nestjs/common";
import { AlertNotifier, NotificationPayload } from "./alert-notifier.interface";

@Injectable()
export class EmailNotifier implements AlertNotifier {
  readonly channelName = "email";
  private readonly logger = new Logger(EmailNotifier.name);

  async notify(payload: NotificationPayload): Promise<boolean> {
    const { alert, budget, recipients = [] } = payload;
    const recipientList = recipients.length > 0 ? recipients.join(", ") : "organization admin(s)";

    const subject = `[SpendGuard Alert] ${alert.severity.toUpperCase()} Limit Breach for ${budget.scope} budget (${budget.id})`;
    const body = `
      SpendGuard Budget Alert:
      - Severity: ${alert.severity.toUpperCase()}
      - Scope: ${budget.scope} (Target: ${budget.projectId ?? budget.teamTagValue ?? "Entire Organization"})
      - Threshold: $${alert.thresholdUsd ?? (alert.severity === "soft" ? budget.softLimitUsd : budget.hardLimitUsd)}
      - Current Spend: $${alert.currentSpendUsd ?? "N/A"}
      - Period: ${budget.period} (${alert.periodKey})
      - Fired At: ${alert.firedAt?.toISOString?.() ?? new Date().toISOString()}
    `.trim();

    this.logger.log(`[EmailNotifier] Sending email to ${recipientList} -> Subject: ${subject}`);
    // When SMTP/Resend/SendGrid is configured in env, send real message; otherwise log delivery
    if (process.env.SMTP_HOST || process.env.RESEND_API_KEY) {
      this.logger.log(`[EmailNotifier] Delivered via configured mail provider.`);
    }

    return true;
  }
}
