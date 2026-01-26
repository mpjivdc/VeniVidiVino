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
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet('1xbOaIsbnrxTMqc77L3QYnMXTiecMrT3PtQyn4aAlSOE', serviceAccountAuth);
    await doc.loadInfo();
    return doc;
}
