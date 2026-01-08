import { ConfidentialClientApplication } from "@azure/msal-node";

let cachedMsalClient: ConfidentialClientApplication | null = null;

/**
 * Get MSAL client instance (lazy initialization)
 * This ensures the client is only created when actually needed,
 * not during build time
 */
export function getMsalClient(): ConfidentialClientApplication {
  if (cachedMsalClient) {
    return cachedMsalClient;
  }

  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("Missing Azure env vars (AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET).");
  }

  cachedMsalClient = new ConfidentialClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret,
    },
  });

  return cachedMsalClient;
}
