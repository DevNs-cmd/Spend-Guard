import { Alert } from "../../entities/alert.entity";
import { Budget } from "../../entities/budget.entity";

export interface NotificationPayload {
  alert: Alert;
  budget: Budget;
  organizationName?: string;
  recipients?: string[];
  customMessage?: string;
}

export interface AlertNotifier {
  readonly channelName: string;
  notify(payload: NotificationPayload): Promise<boolean>;
}
