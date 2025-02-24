# Email Ingestion Configuration

This project allows users to configure email ingestion settings and fetch emails using different connection types such as IMAP, POP3, Gmail API, or Outlook/Graph API.

## Getting Started

### Prerequisites
Ensure you have the following installed:
- **Node.js** (LTS version recommended)
- **npm** (Node Package Manager)
- **PostgreSQL** (Ensure your database is running)
- **Prisma** (for database ORM)

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/vivek5130/Email_PDF_Ingestion.git
   cd Email_PDF_Ingestion
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure your **.env** file:
   ```sh
   DATABASE_URL="postgresql://username:password@localhost:5432/database"
   ```
4. Run database migrations:
   ```sh
   npx prisma migrate dev --name init
   ```

## Running the Application
To start the development server, run:
```sh
npm run dev
```
This will launch the application on **http://localhost:3000/**.

## Configuring Email Ingestion
After starting the application, navigate to the UI and enter the required details:

| Field | Description |
|--------|-------------|
| **Email Address** | Enter the email address you want to fetch emails from. |
| **Connection Type** | Choose IMAP, POP3, Gmail API, or Outlook API. |
| **Username** | Typically the same as the email address. |
| **Password/Token** | A 12-digit app password. To generate one, go to **Google My Account > Security > App Passwords** (2FA must be enabled). |
| **Host** | For Gmail, use `imap.gmail.com`. |

Click **Submit** to save the configuration.

## Managing Configurations
- **View Saved Configurations:** A list of saved email configurations is displayed on the UI.
- **Edit Configuration:** Click **Edit** to modify an existing configuration.
- **Delete Configuration:** Click **Delete** to remove an email configuration.
- **Check Inbox:** Click **Check Inbox Now** to fetch emails from the configured account.

## Database Management
To inspect and manage the database, run:
```sh
npx prisma studio
```
This opens a UI to view, add, or delete records in the database.

## API Endpoints
- **GET /api/email-ingestion/config** → Fetch all saved configurations
- **POST /api/email-ingestion/config** → Save a new configuration
- **PUT /api/email-ingestion/config?id=<config_id>** → Update an existing configuration
- **DELETE /api/email-ingestion/config?id=<config_id>** → Delete a configuration
- **POST /api/email-ingestion/check-emails** → Fetch emails from the configured account

## Troubleshooting
1. **Database connection issues:**
   - Ensure your PostgreSQL database is running.
   - Verify your `DATABASE_URL` in the `.env` file.
   - Run `npx prisma migrate dev` to apply migrations.

2. **Email fetching issues:**
   - Ensure IMAP/POP3 is enabled in your email provider.
   - Double-check your app password and two-factor authentication settings.
   - Check console logs for API errors.



## Contact
For issues or feature requests, please create an issue in the repository or contact the maintainer.

