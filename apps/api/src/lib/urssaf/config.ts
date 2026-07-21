export interface UrssafApiConfig {
  enabled: boolean;
  mock: boolean;
  baseUrl: string;
  clientCertPath: string | null;
  clientKeyPath: string | null;
  encryptionKey: string | null;
}

export function getUrssafApiConfig(): UrssafApiConfig {
  return {
    enabled: process.env.URSSAF_API_ENABLED === "true",
    mock:
      process.env.URSSAF_API_MOCK !== "false" &&
      process.env.URSSAF_API_ENABLED !== "true",
    baseUrl:
      process.env.URSSAF_API_BASE_URL?.trim() ||
      "https://api-sandbox.urssaf.fr/tiers-prestation",
    clientCertPath: process.env.URSSAF_CLIENT_CERT_PATH?.trim() || null,
    clientKeyPath: process.env.URSSAF_CLIENT_KEY_PATH?.trim() || null,
    encryptionKey: process.env.URSSAF_ENCRYPTION_KEY?.trim() || null,
  };
}

export function isUrssafApiOperational(): boolean {
  const config = getUrssafApiConfig();
  return config.enabled || config.mock;
}
