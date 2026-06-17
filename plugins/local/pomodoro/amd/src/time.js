/**
 * Timer state and time calculations for Pomodoro.
 *
 * @module     local_pomodoro/time
 * @copyright  2026 José Carlos
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define([
    'local_pomodoro/constants',
    'local_pomodoro/default_settings',
    'local_pomodoro/storage',
    'local_pomodoro/settings'
], function(Constants, Defaults, Storage, Settings) {
    /**
     * Load the timer state from localStorage.
     *
     * @returns {Object} Current timer state.
     */
    const getState = function() {
        return Object.assign({}, Defaults.state, Storage.readJson(Constants.keys.state, Defaults.state));
    };

    /**
     * Persist the timer state.
     *
     * @param {Object} state Timer state.
     */
    const saveState = function(state) {
        Storage.writeJson(Constants.keys.state, Object.assign({}, Defaults.state, state));
    };

    /**
     * Build a cycle identifier used for single notifications.
     *
     * @param {String} mode Timer mode.
     * @param {Number} currentCycle Current focus cycle.
     * @returns {String} Cycle identifier.
     */
    const createCycleId = function(mode, currentCycle) {
        return mode + ':' + currentCycle + ':' + Date.now();
    };

    /**
     * Calculate remaining seconds for the current state.
     *
     * @param {Object} state Timer state.
     * @param {Object} settings Timer settings.
     * @returns {Number} Remaining seconds.
     */
    const getRemainingSeconds = function(state, settings) {
        if (state.status === 'idle') {
            return Settings.getDurationSeconds('focus', settings);
        }

        if (state.status === 'paused') {
            return Math.max(0, parseInt(state.pausedRemainingSeconds, 10) || 0);
        }

        const endsAt = parseInt(state.endsAt, 10) || Date.now();
        return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    };

    /**
     * Format seconds as MM:SS.
     *
     * @param {Number} totalSeconds Seconds to format.
     * @returns {String} Formatted time.
     */
    const formatTime = function(totalSeconds) {
        const safeSeconds = Math.max(0, parseInt(totalSeconds, 10) || 0);
        const minutes = Math.floor(safeSeconds / 60);
        const seconds = safeSeconds % 60;

        return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    };

    /**
     * Determine the next Pomodoro cycle after the current one.
     *
     * @param {Object} state Timer state.
     * @param {Object} settings Timer settings.
     * @returns {Object} Next mode and cycle.
     */
    const getNextCycle = function(state, settings) {
        if (state.mode === 'focus') {
            return {
                mode: state.currentCycle >= settings.cyclesBeforeLongBreak ? 'long_break' : 'short_break',
                currentCycle: state.currentCycle
            };
        }

        return {
            mode: 'focus',
            currentCycle: state.mode === 'long_break' ? 1 : state.currentCycle + 1
        };
    };

    /**
     * Build a running cycle state.
     *
     * @param {String} mode Timer mode.
     * @param {Number} currentCycle Current cycle.
     * @param {Object} settings Timer settings.
     * @returns {Object} Running state.
     */
    const buildCycleState = function(mode, currentCycle, settings) {
        const duration = Settings.getDurationSeconds(mode, settings);
        const now = Date.now();

        return {
            status: 'running',
            mode: mode,
            startedAt: now,
            endsAt: now + (duration * 1000),
            pausedRemainingSeconds: null,
            currentCycle: currentCycle,
            cycleId: createCycleId(mode, currentCycle)
        };
    };

    return {
        buildCycleState: buildCycleState,
        formatTime: formatTime,
        getNextCycle: getNextCycle,
        getRemainingSeconds: getRemainingSeconds,
        getState: getState,
        saveState: saveState
    };
});
