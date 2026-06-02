import { google } from "googleapis";

/**
 * Initializes and returns a Google Sheets API client using JWT authentication.
 */
export function getSheetsClient() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  
  if (!email || !privateKey) {
    throw new Error("Missing Google API service account credentials in environment variables");
  }
  
  // Clean private key - handle newline characters escaping
  const formattedKey = privateKey.replace(/\\n/g, "\n");
  
  const auth = new google.auth.JWT({
    email,
    key: formattedKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  
  return google.sheets({ version: "v4", auth });
}
