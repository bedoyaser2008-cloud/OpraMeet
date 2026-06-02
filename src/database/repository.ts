import { getSheetsClient } from "./connection";
import { encryptPayload, decryptPayload } from "./crypto";

export interface RoomRecord {
  roomId: string;
  hostId: string;
  isPrivate: boolean;
  passcodeHash: string | null;
  createdAt: number;
  lockedAt: number | null;
  waitingRoom: boolean;
  allowedMembers: string[];
  endedAt: number | null;
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
const SHEET_RANGE = "Sheet1!A:B";

/**
 * Fetches a room record from Google Sheets and decrypts it.
 * Note: Returns the record even if endedAt is set; the caller decides how to handle ended rooms.
 */
export async function fetchRoom(roomId: string): Promise<RoomRecord | null> {
  if (!SPREADSHEET_ID) {
    console.error("GOOGLE_SHEETS_SPREADSHEET_ID is not configured");
    return null;
  }
  
  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_RANGE,
    });
    
    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return null;
    }
    
    // Scan rows starting from row 2 (index 1)
    for (let i = 1; i < rows.length; i++) {
      const [rowRoomId, encryptedPayload] = rows[i];
      if (rowRoomId === roomId) {
        if (!encryptedPayload) return null;
        try {
          return decryptPayload<RoomRecord>(encryptedPayload);
        } catch (decryptErr) {
          console.error(`Failed to decrypt room payload for room ${roomId}:`, decryptErr);
          return null;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching room ${roomId} from sheets:`, error);
    return null;
  }
}

/**
 * Saves or updates a room record in Google Sheets.
 */
export async function saveRoom(room: RoomRecord): Promise<void> {
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not configured");
  }
  
  const sheets = getSheetsClient();
  const encryptedPayload = encryptPayload(room);
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_RANGE,
    });
    
    const rows = response.data.values || [];
    
    // If the sheet is empty, write header row first
    if (rows.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: "Sheet1!A1:B1",
        valueInputOption: "RAW",
        requestBody: {
          values: [["Room ID", "Payload"]],
        },
      });
      rows.push(["Room ID", "Payload"]);
    }
    
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === room.roomId) {
        rowIndex = i;
        break;
      }
    }
    
    if (rowIndex !== -1) {
      // Update existing row (i matches index, row number is i + 1)
      const updateRange = `Sheet1!A${rowIndex + 1}:B${rowIndex + 1}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: updateRange,
        valueInputOption: "RAW",
        requestBody: {
          values: [[room.roomId, encryptedPayload]],
        },
      });
    } else {
      // Append a new row
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Sheet1!A2:B",
        valueInputOption: "RAW",
        requestBody: {
          values: [[room.roomId, encryptedPayload]],
        },
      });
    }
  } catch (error) {
    console.error(`Error saving room ${room.roomId} to sheets:`, error);
    throw error;
  }
}

/**
 * Performs a soft-delete on a room record by setting endedAt timestamp.
 */
export async function deleteRoom(roomId: string): Promise<void> {
  const room = await fetchRoom(roomId);
  if (!room) {
    throw new Error(`Room ${roomId} not found`);
  }
  
  room.endedAt = Date.now();
  await saveRoom(room);
}
