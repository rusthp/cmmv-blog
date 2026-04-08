import { Logger, Config } from "@cmmv/core";
import * as crypto from "crypto";

export interface SearchConsoleRow {
    url: string;
    keyword: string;
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
}

/**
 * Google Search Console API integration using service account JWT auth.
 *
 * Config keys:
 *   - blog.googleSearchConsoleServiceAccount (JSON string of service account)
 *   - blog.googleSearchConsoleSiteUrl (e.g. "https://proplaynews.com.br")
 */
export class SearchConsoleService {
    private static readonly logger = new Logger("SearchConsoleService");

    /**
     * Build a signed RS256 JWT and exchange it for an access token
     * using the Google OAuth2 token endpoint.
     */
    private async getAccessToken(): Promise<string> {
        const serviceAccountJson = Config.get<string>("blog.googleSearchConsoleServiceAccount", "");

        if (!serviceAccountJson) {
            throw new Error("blog.googleSearchConsoleServiceAccount not configured");
        }

        let sa: { client_email: string; private_key: string };

        try {
            sa = JSON.parse(serviceAccountJson);
        } catch {
            throw new Error("Invalid JSON in blog.googleSearchConsoleServiceAccount");
        }

        if (!sa.client_email || !sa.private_key) {
            throw new Error("Service account JSON missing client_email or private_key");
        }

        const now = Math.floor(Date.now() / 1000);
        const scope = "https://www.googleapis.com/auth/webmasters.readonly";

        const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
        const payload = Buffer.from(JSON.stringify({
            iss: sa.client_email,
            scope,
            aud: "https://oauth2.googleapis.com/token",
            iat: now,
            exp: now + 3600,
        })).toString("base64url");

        const signInput = `${header}.${payload}`;
        const signature = crypto
            .createSign("RSA-SHA256")
            .update(signInput)
            .sign(sa.private_key, "base64url");

        const jwt = `${signInput}.${signature}`;

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                assertion: jwt,
            }),
        });

        if (!tokenResponse.ok) {
            const errText = await tokenResponse.text();
            throw new Error(`OAuth2 token exchange failed (${tokenResponse.status}): ${errText}`);
        }

        const tokenData = await tokenResponse.json() as { access_token: string };
        return tokenData.access_token;
    }

    /**
     * Fetch search analytics data from Google Search Console.
     *
     * @param days Number of days to look back (default 30)
     * @returns Array of SearchConsoleRow
     */
    async fetchSearchAnalytics(days: number = 30): Promise<SearchConsoleRow[]> {
        const siteUrl = Config.get<string>("blog.googleSearchConsoleSiteUrl", "");

        if (!siteUrl) {
            SearchConsoleService.logger.log("blog.googleSearchConsoleSiteUrl not configured, skipping");
            return [];
        }

        SearchConsoleService.logger.log(`[seo] Fetching Search Console data for last ${days} days`);

        const accessToken = await this.getAccessToken();

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const formatDate = (d: Date) => d.toISOString().split("T")[0];

        const encodedSiteUrl = encodeURIComponent(siteUrl);
        const apiUrl = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`;

        const body = {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            dimensions: ["query", "page"],
            rowLimit: 5000,
        };

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Search Console API failed (${response.status}): ${errText}`);
        }

        const data = await response.json() as {
            rows?: Array<{
                keys: string[];
                clicks: number;
                impressions: number;
                ctr: number;
                position: number;
            }>;
        };

        if (!data.rows || data.rows.length === 0) {
            SearchConsoleService.logger.log("[seo] No search analytics data returned");
            return [];
        }

        SearchConsoleService.logger.log(`[seo] Received ${data.rows.length} rows from Search Console`);

        return data.rows.map(row => ({
            url: row.keys[1] || "",
            keyword: row.keys[0] || "",
            impressions: row.impressions,
            clicks: row.clicks,
            ctr: row.ctr,
            position: row.position,
        }));
    }
}
