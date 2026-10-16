# Production deployment and free storage

## Current release arrangement

Keep the existing repository and its two connected Vercel projects:

| Project | Repository root | Production URL |
| --- | --- | --- |
| Public website + API | `nextjs-app` | https://www.pawanbuildhome.com |
| Admin workspace | `admin-panel` | https://property-dealing-new-siia-dun.vercel.app |

The admin currently uses `https://property-dealing-new.vercel.app/api`, which is the main website's API. Keep that value, or use `https://www.pawanbuildhome.com/api`. Both apps must use the same API/database. A push to the connected production branch (`main`) starts the existing Vercel deployments. No separate Express backend or legacy frontend deployment is needed.

The user elected to keep the existing Vercel setup. No plan upgrade is part of this release. Vercel's free Hobby plan is restricted to personal, non-commercial use; a property business is commercial. Keeping Vercel therefore is not an assurance of zero-cost commercial hosting. Plan reference: https://vercel.com/docs/plans/hobby

## Where the data lives

| Content | Service | How to manage it |
| --- | --- | --- |
| Property titles, descriptions, prices, location, area/society records and enquiry messages | MongoDB Atlas | Use the website admin for everyday changes. Use Atlas Data Explorer for direct inspection or maintenance. |
| Property photographs, maps and uploaded images | Cloudinary | Upload through the admin; files go to Cloudinary and their URLs are saved in MongoDB. Cloudinary's Media Library manages originals. |
| Source code and bespoke procedural 3D models | This GitHub repository | Edit and push code. The models do not need external asset storage. |

Do not store images as base64 in MongoDB, commit uploads to Git, or depend on Vercel's local filesystem for persistent storage.

Read-only checks before this release confirmed the deployed API reports its database as Connected. The configured Cloudinary account reports plan Free, with approximately 3.13 / 25 monthly credits used at the time checked. The local PC's Atlas networking problem does not establish a Vercel database failure. Reusing the working services avoids resetting or losing the existing listings.

## Free database setup if you need a new account you control

1. Sign in at https://cloud.mongodb.com/ using an account you can recover. Create a project for Pawan Buildhome.
2. Create a **Free** cluster (formerly M0), not Flex, a paid dedicated tier or a trial. Choose a region near the hosting functions.
3. In **Database Access**, create a dedicated database user with a generated password and read/write access to the `real-estate` database. Save it in a password manager.
4. In **Network Access**, allow the server's outbound addresses. Ordinary Vercel serverless deployments do not have a fixed free outbound IP; an Atlas allow entry of `0.0.0.0/0` permits dynamic egress, so use a strong, unique database password and the limited database role above. Add your own PC's address if required for local maintenance.
5. Choose **Connect > Drivers > Node.js**, copy the connection URI, substitute the database user's password (URL-encoded when necessary), and use `/real-estate` as the database path.
6. Put that URI into **the main Vercel project's Settings > Environment Variables > MONGODB_URI**, for Production and any intended Preview environment. Redeploy after changing it. Never put it in the admin build or any `NEXT_PUBLIC_` / `REACT_APP_` variable.
7. Import the existing property/area data before switching a public site to an empty replacement database. The previously scraped archive remains a local backup outside the repository; it was not imported as part of this release. No production records were changed during deployment checks.
8. Keep a manual backup. Atlas Free does not include managed backups.

Atlas Free provides 512 MB including indexes and has capacity limits; it is not unlimited. Official setup and limits:
- https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/
- https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/

The database URI and Gmail app password were present in the repository's old `backend/.env` history. This release removes that file from current Git tracking, but does not erase history. Rotate those two credentials in their owning accounts and update Vercel; deleting the current file does not revoke historical credentials.

## Free image storage

The existing Cloudinary account already works and is on Free. To use a new account:

1. Register at https://cloudinary.com/ and select the **Image and Video APIs Free** product, not a paid plan or a temporary DAM trial.
2. Open the account's API credentials/settings and copy the cloud name, API key and API secret.
3. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in the **main website's Vercel environment**, then redeploy it. Keep the secret out of frontend variables and Git.
4. Add or edit a property in the admin and upload its photographs. The API uploads to the `pawan-buildhome` folder; the database stores their delivered URLs.
5. Check the Usage dashboard periodically. Free currently includes **25 shared monthly credits** covering storage, delivery and transformations, not 25 GB of each. Image previews already request automatic format/quality and capped dimensions.
6. Retain the original images locally. If you move to a different Cloudinary account, migrate images and update their stored URLs before removing the old account.

Official pricing: https://cloudinary.com/pricing

## Production environment checklist

Main project (`nextjs-app`):

- `MONGODB_URI` — connection URI for the chosen Atlas database.
- `JWT_SECRET` — a long random server-only signing secret.
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` — production admin credentials; missing credentials now disable admin login rather than enabling defaults.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — image account.
- `MONGODB_AUTO_INDEX=false`, `MONGODB_AUTO_CREATE=false` — avoid automatic schema setup against existing data.
- `GMAIL_USER`, `GMAIL_APP_PASSWORD` — only when enquiry email notifications are wanted; the message is still stored in MongoDB if notification fails.
- Leave `LANDING_CONTENT_API_URL` **unset** in production; it is an optional local public-feed aid. The production website and admin must share the real database.
- Keep secrets only in Vercel and ignored local environment files. Vercel supplies `NODE_ENV=production` during deployment.

Admin project (`admin-panel`):

- `REACT_APP_API_URL=https://property-dealing-new.vercel.app/api` (the existing main deployment), or `https://www.pawanbuildhome.com/api`.
- `REACT_APP_WEBSITE_URL=https://www.pawanbuildhome.com`.
- These two values are public URLs, not credentials. CRA embeds them at build time, so redeploy the admin after edits.

## Verification and routine use

- `npm.cmd --prefix nextjs-app run check:landing`
- `npm.cmd --prefix nextjs-app run check:management`
- `npm.cmd --prefix nextjs-app run build`
- `npm.cmd --prefix admin-panel test -- --watchAll=false --runInBand`
- `npm.cmd --prefix admin-panel run build`

After both Vercel deployments are Ready, verify the public homepage, property listing/detail, admin login, and `/api/health`. Unauthenticated management writes must return 401 without accessing MongoDB or Cloudinary. Actual production creates, updates, deletions, email sends and image uploads were not used as deployment probes.

Daily workflow: open the admin, sign in, and manage **Properties**, **Areas & societies**, **Media library**, and **Enquiries**. Published properties appear automatically in the interactive map, including on already-open pages when their live inventory refresh runs. The site uses current API records; no sample inventory was introduced.
