/**
 * Settings helpers for the Pomodoro timer.
 *
 * @module     local_pomodoro/settings
 * @copyright  2026 José Carlos
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define([
    'local_pomodoro/constants',
    'local_pomodoro/default_settings',
    'local_pomodoro/storage'
], function(Constants, Defaults, Storage) {
    /**
     * Clamp a numeric setting to its configured limits.
     *
     * @param {*} value Raw setting value.
     * @param {String} key Setting key.
     * @returns {Number} Clamped integer.
     */
    const clampInteger = function(value, key) {
        const limits = Defaults.limits[key];
        const parsed = parseInt(value, 10);
        const safeValue = Number.isFinite(parsed) ? parsed : Defaults.settings[key];

        return Math.min(Math.max(safeValue, limits.min), limits.max);
    };

    /**
     * Clamp a duration in seconds to the configured range step.
     *
     * @param {*} value Raw duration in seconds.
     * @returns {Number} Duration in seconds.
     */
    const clampDurationSeconds = function(value) {
        const limits = Defaults.limits.durationSeconds;
        const parsed = parseInt(value, 10);
        const safeValue = Number.isFinite(parsed) ? parsed : limits.min;
        const clamped = Math.min(Math.max(safeValue, limits.min), limits.max);

        return Math.round(clamped / limits.step) * limits.step;
    };

    /**
     * Split total seconds into minute and second settings.
     *
     * @param {Object} settings Settings object.
     * @param {String} prefix Duration setting prefix.
     * @param {Number} totalSeconds Total seconds.
     */
    const setDuration = function(settings, prefix, totalSeconds) {
        const safeSeconds = clampDurationSeconds(totalSeconds);
        const minuteKey = prefix + 'Minutes';
        const secondKey = prefix + 'Seconds';

        settings[minuteKey] = Math.floor(safeSeconds / 60);
        settings[secondKey] = safeSeconds % 60;
    };

    /**
     * Get total seconds for a duration setting prefix.
     *
     * @param {Object} settings Settings object.
     * @param {String} prefix Duration setting prefix.
     * @returns {Number} Total seconds.
     */
    const getDurationByPrefix = function(settings, prefix) {
        return (settings[prefix + 'Minutes'] * 60) + settings[prefix + 'Seconds'];
    };

    const durationFieldPrefixes = {
        focusDurationSeconds: 'focus',
        shortBreakDurationSeconds: 'shortBreak',
        longBreakDurationSeconds: 'longBreak'
    };

    const modePrefixes = {
        short_break: 'shortBreak',
        long_break: 'longBreak'
    };

    /**
     * Format a duration for display near a range field.
     *
     * @param {Number} totalSeconds Duration in seconds.
     * @returns {String} Display text.
     */
    const formatDurationLabel = function(totalSeconds) {
        const seconds = clampDurationSeconds(totalSeconds);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes === 0) {
            return remainingSeconds + 's';
        }

        if (remainingSeconds === 0) {
            return minutes + 'min';
        }

        return minutes + 'min ' + remainingSeconds + 's';
    };

    /**
     * Normalise timer settings loaded from storage or forms.
     *
     * @param {Object} settings Raw settings.
     * @returns {Object} Safe settings.
     */
    const normaliseSettings = function(settings) {
        const merged = Object.assign({}, Defaults.settings, settings || {});
        const normalised = {
            focusMinutes: clampInteger(merged.focusMinutes, 'focusMinutes'),
            focusSeconds: clampInteger(merged.focusSeconds, 'focusSeconds'),
            shortBreakMinutes: clampInteger(merged.shortBreakMinutes, 'shortBreakMinutes'),
            shortBreakSeconds: clampInteger(merged.shortBreakSeconds, 'shortBreakSeconds'),
            longBreakMinutes: clampInteger(merged.longBreakMinutes, 'longBreakMinutes'),
            longBreakSeconds: clampInteger(merged.longBreakSeconds, 'longBreakSeconds'),
            cyclesBeforeLongBreak: clampInteger(merged.cyclesBeforeLongBreak, 'cyclesBeforeLongBreak')
        };

        setDuration(normalised, 'focus', getDurationByPrefix(normalised, 'focus'));
        setDuration(normalised, 'shortBreak', getDurationByPrefix(normalised, 'shortBreak'));
        setDuration(normalised, 'longBreak', getDurationByPrefix(normalised, 'longBreak'));

        return normalised;
    };

    /**
     * Load settings from localStorage.
     *
     * @returns {Object} Current settings.
     */
    const getSettings = function() {
        return normaliseSettings(Storage.readJson(Constants.keys.settings, Defaults.settings));
    };

    /**
     * Persist settings.
     *
     * @param {Object} settings New settings.
     * @returns {Object} Saved settings.
     */
    const saveSettings = function(settings) {
        const normalised = normaliseSettings(settings);
        Storage.writeJson(Constants.keys.settings, normalised);

        return normalised;
    };

    /**
     * Calculate the duration for a timer mode.
     *
     * @param {String} mode Timer mode.
     * @param {Object} settings Timer settings.
     * @returns {Number} Duration in seconds.
     */
    const getDurationSeconds = function(mode, settings) {
        return getDurationByPrefix(settings, modePrefixes[mode] || 'focus');
    };

    /**
     * Read settings values from a form region.
     *
     * @param {HTMLElement} root Root element.
     * @param {String} selector Input selector.
     * @returns {Object} Normalised settings.
     */
    const readSettingsFrom = function(root, selector) {
        const next = Object.assign({}, getSettings());

        root.querySelectorAll(selector).forEach(function(input) {
            const key = input.dataset.pomodoroSettingField || input.dataset.pomodoroPanelField;
            const prefix = durationFieldPrefixes[key];

            if (prefix) {
                setDuration(next, prefix, input.value);
            } else {
                next[key] = input.value;
            }
        });

        return normaliseSettings(next);
    };

    /**
     * Write settings values into a form region.
     *
     * @param {HTMLElement} root Root element.
     * @param {String} selector Input selector.
     * @param {Object} settings Settings to write.
     */
    const writeSettingsTo = function(root, selector, settings) {
        root.querySelectorAll(selector).forEach(function(input) {
            if (document.activeElement === input) {
                return;
            }

            const key = input.dataset.pomodoroSettingField || input.dataset.pomodoroPanelField;
            const prefix = durationFieldPrefixes[key];

            if (prefix) {
                input.value = getDurationByPrefix(settings, prefix);
            } else {
                input.value = settings[key];
            }

            const output = input.parentNode.querySelector('[data-pomodoro-range-output]');
            if (output && key.indexOf('DurationSeconds') !== -1) {
                output.textContent = formatDurationLabel(input.value);
            } else if (output) {
                output.textContent = input.value;
            }
        });
    };

    return {
        formatDurationLabel: formatDurationLabel,
        getDurationSeconds: getDurationSeconds,
        getSettings: getSettings,
        normaliseSettings: normaliseSettings,
        readSettingsFrom: readSettingsFrom,
        saveSettings: saveSettings,
        writeSettingsTo: writeSettingsTo
    };
});
