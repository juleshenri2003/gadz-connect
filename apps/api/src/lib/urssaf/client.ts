import { readFileSync } from "node:fs";
import { request as httpsRequest, type RequestOptions } from "node:https";
import { getUrssafApiConfig } from "./config.js";
import { logUrssafApiCall } from "./audit-log.js";

export interface UrssafRequestOptions {
  method: "GET" | "POST";
  path: string;
  body?: Record<string, unknown>;
  audit?: {
    profileId?: string;
    courseId?: string;
    transactionId?: string;
    methodLabel: string;
  };
}

export interface UrssafResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

function buildUrl(path: string): string {
  const { baseUrl } = getUrssafApiConfig();
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function httpRequest<T>(
  options: UrssafRequestOptions,
): Promise<UrssafResponse<T>> {
  const config = getUrssafApiConfig();
  const url = new URL(buildUrl(options.path));
  const body = options.body ? JSON.stringify(options.body) : undefined;

  const requestOptions: RequestOptions = {
    method: options.method,
    hostname: url.hostname,
    port: url.port ? Number(url.port) : 443,
    path: `${url.pathname}${url.search}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
    },
  };

  if (config.clientCertPath && config.clientKeyPath) {
    requestOptions.cert = readFileSync(config.clientCertPath);
    requestOptions.key = readFileSync(config.clientKeyPath);
  }

  return new Promise((resolve) => {
    const req = httpsRequest(requestOptions, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        let data: T | null = null;
        try {
          data = raw ? (JSON.parse(raw) as T) : null;
        } catch {
          data = null;
        }
        const status = res.statusCode ?? 500;
        const ok = status >= 200 && status < 300;
        void logUrssafApiCall({
          profileId: options.audit?.profileId,
          courseId: options.audit?.courseId,
          transactionId: options.audit?.transactionId,
          method: options.audit?.methodLabel ?? options.method,
          requestPath: options.path,
          requestSummary: options.body,
          responseStatus: status,
          responseSummary: data ? (data as Record<string, unknown>) : { raw },
          errorMessage: ok ? undefined : raw.slice(0, 500),
        });
        resolve({
          ok,
          status,
          data,
          error: ok ? undefined : raw.slice(0, 500),
        });
      });
    });

    req.on("error", (err) => {
      void logUrssafApiCall({
        profileId: options.audit?.profileId,
        courseId: options.audit?.courseId,
        transactionId: options.audit?.transactionId,
        method: options.audit?.methodLabel ?? options.method,
        requestPath: options.path,
        requestSummary: options.body,
        errorMessage: err.message,
      });
      resolve({ ok: false, status: 0, data: null, error: err.message });
    });

    if (body) req.write(body);
    req.end();
  });
}

export async function urssafApiRequest<T>(
  options: UrssafRequestOptions,
): Promise<UrssafResponse<T>> {
  return httpRequest<T>(options);
}
