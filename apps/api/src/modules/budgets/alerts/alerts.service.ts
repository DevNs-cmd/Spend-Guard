import { Injectable, Logger } from "@nestjs/common";
import { Alert } from "../entities/alert.entity";
import { Budget } from "../entities/budget.entity";
import { EmailNotifier } from "./notifiers/email.notifier";
import { SlackNotifier } from "./notifiers/slack.notifier";
import { InAppNotifier } from "./notifiers/in-app.notifier";
import { AlertNotifier, NotificationPayload } from "./notifiers/alert-notifier.interface";

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  private readonly notifiers: AlertNotifier[];

  constructor(
    private readonly emailNotifier: EmailNotifier,
    private readonly slackNotifier: SlackNotifier,
    private readonly inAppNotifier: InAppNotifier,
  ) {
    this.notifiers = [this.emailNotifier, this.slackNotifier, this.inAppNotifier];
  }

  /**
   * Fans out a fired Alert to configured channels (email, Slack, in-app).
   * Respects each organization's enabled channels.
   */
  async dispatch(
    alert: Alert,
    budget: Budget,
    options?: {
      enabledChannels?: string[];
      recipients?: string[];
    },
  ): Promise<void> {
    const enabledChannels = options?.enabledChannels ?? ["email", "slack", "in-app"];
    const payload: NotificationPayload = {
      alert,
      budget,
      recipients: options?.recipients,
    };

    const dispatchPromises = this.notifiers
      .filter((notifier) => enabledChannels.includes(notifier.channelName))
      .map(async (notifier) => {
        try {
          await notifier.notify(payload);
        } catch (err) {
          this.logger.error(
            `Failed to dispatch alert to channel ${notifier.channelName}: ${(err as Error).message}`,
          );
        }
      });

    await Promise.allSettled(dispatchPromises);
  }
}
