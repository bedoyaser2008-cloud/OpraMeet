export const ROOM_ID_REGEX = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;

/**
 * Generates a random, meeting-friendly room ID in the format "abc-abcd-abc" using lowercase alphabets.
 */
export function generateRoomId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  
  const genSegment = (len: number): string => {
    let segment = "";
    for (let i = 0; i < len; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    return segment;
  };
  
  return `${genSegment(3)}-${genSegment(4)}-${genSegment(3)}`;
}

/**
 * Validates whether a room ID string is in the format "abc-abcd-abc".
 */
export function isValidRoomId(roomId: string): boolean {
  return ROOM_ID_REGEX.test(roomId);
}
