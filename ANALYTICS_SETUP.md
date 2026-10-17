# Admin traffic dashboard

The overview uses your real property and enquiry endpoints. Website traffic is read separately through Vercel's official Web Analytics API. No demo traffic is shown.

On the **public Next.js Vercel project** (the project serving `pawanbuildhome.com`), add these server-only environment variables in Settings → Environment Variables:

| Variable | Value |
| --- | --- |
| `VERCEL_ANALYTICS_TOKEN` | A Vercel access token with permission to read the public website project |
| `VERCEL_ANALYTICS_PROJECT_ID` | The public website's project ID from its General settings |
| `VERCEL_ANALYTICS_TEAM_ID` | Its owning team ID, if team-owned; omit for a personal project |

Redeploy the public project after adding them. Do not add the token to the admin frontend, any `REACT_APP_` / `NEXT_PUBLIC_` variable, or Git.

Tracking being enabled does not itself grant the admin API permission to read analytics. The dashboard shows a connection message until these settings are supplied. The API requires the existing administrator login and never returns the Vercel token or upstream error details.

The first two traffic figures are all-time production page views and unique visitors. The chart shows the last seven UTC days; today is partial. Daily visitors are not summed to calculate unique lifetime visitors. Vercel reporting windows and API access remain subject to your plan. Upstream reads are cached for two minutes; authenticated responses are private and not cached by the browser.

For local development, put the same server-only variables in the ignored `nextjs-app/.env.local`, and point the admin's API URL at that local Next.js server. Property and enquiry data still use the configured database; this integration does not migrate or write business records.

Reference: https://vercel.com/docs/analytics/web-analytics-api
