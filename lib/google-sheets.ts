import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function getDoc() {
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    if (!credentialsJson) {
        throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON environment variable");
    }

    const credentials = JSON.parse(credentialsJson);

    const serviceAccountAuth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) {
        throw new Error("Missing GOOGLE_SHEET_ID environment variable");
    }

    console.log(`Connecting to Sheet ID: ${sheetId}`);

    const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
    await doc.loadInfo();
    console.log(`[GoogleSheets] AUTH SUCCESS: Using Sheet ID "${sheetId}" (Title: "${doc.title}")`);
    return doc;
}
