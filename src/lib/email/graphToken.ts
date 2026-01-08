import { getMsalClient } from "./msalClient";

export async function getGraphAppAccessToken(): Promise<string> {
  const msalClient = getMsalClient();
  
  const result = await msalClient.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });

  if (!result?.accessToken) {
    throw new Error("MSAL returned no accessToken for client credentials request.");
  }

  return result.accessToken;
}
