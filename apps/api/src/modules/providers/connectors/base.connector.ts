// Common interface every provider connector must implement.
export interface ProviderConnector {
  fetchUsage(since: Date): Promise<unknown[]>;
}
