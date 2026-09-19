import { Injectable, Logger } from "@nestjs/common";
import { AlertNotifier, NotificationPayload } from "./alert-notifier.interface";

@Injectable()
export class InAppNotifier implements AlertNotifier {
  readonly channelName = "in-app";
  private readonly logger = new Logger(InAppNotifier.name);

  async notify(payload: NotificationPayload): Promise<boolean> {
    const { alert, budget } = payload;
    this.logger.log(`[InAppNotifier] In-app notification stored for org ${alert.organizationId}, budget ${budget.id}, severity ${alert.severity}`);
    return true;
  }
}
