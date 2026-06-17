/**
 * Safe localStorage helpers for the Pomodoro timer.
 *
 * @module     local_pomodoro/storage
 * @copyright  2026 José Carlos
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define([], function() {
    /**
     * Read a JSON value from localStorage.
     *
     * @param {String} key Storage key.
     * @param {*} fallback Value returned when the key is missing or invalid.
     * @returns {*} Parsed value or fallback.
     */
    const readJson = function(key, fallback) {
        try {
            const raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    };

    /**
     * Write a JSON value to localStorage.
     *
     * @param {String} key Storage key.
     * @param {*} value Value to encode.
     */
    const writeJson = function(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            // localStorage can be unavailable in restricted browser contexts.
        }
    };

    /**
     * Read a plain string from localStorage.
     *
     * @param {String} key Storage key.
     * @returns {String|null} Stored value, or null.
     */
    const readString = function(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    };

    /**
     * Write a plain string to localStorage.
     *
     * @param {String} key Storage key.
     * @param {String} value Value to store.
     */
    const writeString = function(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (error) {
            // localStorage can be unavailable in restricted browser contexts.
        }
    };

    return {
        readJson: readJson,
        writeJson: writeJson,
        readString: readString,
        writeString: writeString
    };
});
