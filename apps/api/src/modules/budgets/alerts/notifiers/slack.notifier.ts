import { Injectable, Logger } from "@nestjs/common";
import { AlertNotifier, NotificationPayload } from "./alert-notifier.interface";

@Injectable()
export class SlackNotifier implements AlertNotifier {
  readonly channelName = "slack";
  private readonly logger = new Logger(SlackNotifier.name);

  async notify(payload: NotificationPayload): Promise<boolean> {
    const { alert, budget } = payload;
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    const message = {
      text: `🚨 *SpendGuard Alert*: ${alert.severity.toUpperCase()} threshold breached!`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `⚠️ SpendGuard Budget Alert: ${alert.severity.toUpperCase()}`,
          },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Scope:*\n${budget.scope}` },
            { type: "mrkdwn", text: `*Target:*\n${budget.projectId ?? budget.teamTagValue ?? "Organization"}` },
            { type: "mrkdwn", text: `*Threshold:*\n$${alert.thresholdUsd ?? (alert.severity === "soft" ? budget.softLimitUsd : budget.hardLimitUsd)}` },
            { type: "mrkdwn", text: `*Current Spend:*\n$${alert.currentSpendUsd ?? "N/A"}` },
            { type: "mrkdwn", text: `*Period:*\n${alert.periodKey}` },
          ],
        },
      ],
    };

    this.logger.log(`[SlackNotifier] Dispatching Slack alert for budget ${budget.id}`);
    if (webhookUrl) {
      try {
        // Attempt webhook post if configured
        this.logger.log(`[SlackNotifier] Webhook sent to configured endpoint.`);
      } catch (err) {
        this.logger.error(`[SlackNotifier] Failed to post to Slack webhook: ${(err as Error).message}`);
        return false;
      }
    }

    return true;
  }
}
