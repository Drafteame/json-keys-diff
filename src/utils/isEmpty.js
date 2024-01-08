/**
 * Checks if a given value is considered empty.
 *
 * @param {*} value - The value to check for emptiness.
 * @returns {boolean} - Returns true if the value is empty, otherwise false.
 */
export default function isEmpty(value) {
  // Handles null and undefined
  if (value == null) {
    return true;
  }

  // Checks if a string or array is empty
  if (typeof value === "string" || Array.isArray(value)) {
    return value.length === 0;
  }

  // Checks if an object is empty
  if (typeof value === "object") {
    return Object.keys(value).length === 0;
  }

  // Handles other data types
  return false;
}
