// @CurrentOrg() — extracts the authenticated org context from the request.
// Every module's controllers must use this to scope queries (multi-tenant isolation).
// Owned by Neerav.
export const CurrentOrg = () => () => {};
