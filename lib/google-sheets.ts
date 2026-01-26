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

    const sheetId = '1xbOaIsbnrxTMqc77L3QYnMXTiecMrT3PtQyn4aAlSOE';

    console.log(`Connecting to Sheet ID: ${sheetId}`);

    try {
        const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
        await doc.loadInfo();
        console.log(`[STRICT DEBUG] AUTH SUCCESS: Using Sheet ID "${sheetId}" (Title: "${doc.title}")`);
        return doc;
    } catch (error: any) {
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("FATAL GOOGLE SHEETS ERROR: COULD NOT CONNECT TO SPREADSHEET");
        console.error(`ID ATTEMPTED: ${sheetId}`);
        console.error(`ERROR MESSAGE: ${error.message}`);
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        throw error;
    }
}
