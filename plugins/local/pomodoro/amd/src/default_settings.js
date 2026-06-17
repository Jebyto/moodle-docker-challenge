/**
 * Default Pomodoro settings, state and form limits.
 *
 * @module     local_pomodoro/default_settings
 * @copyright  2026 José Carlos
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define([], function() {
    return {
        settings: {
            focusMinutes: 25,
            focusSeconds: 0,
            shortBreakMinutes: 5,
            shortBreakSeconds: 0,
            longBreakMinutes: 15,
            longBreakSeconds: 0,
            cyclesBeforeLongBreak: 4
        },
        state: {
            status: 'idle',
            mode: 'focus',
            startedAt: null,
            endsAt: null,
            pausedRemainingSeconds: null,
            currentCycle: 1,
            cycleId: null
        },
        limits: {
            focusMinutes: {min: 0, max: 180},
            focusSeconds: {min: 0, max: 59},
            shortBreakMinutes: {min: 0, max: 60},
            shortBreakSeconds: {min: 0, max: 59},
            longBreakMinutes: {min: 0, max: 120},
            longBreakSeconds: {min: 0, max: 59},
            cyclesBeforeLongBreak: {min: 1, max: 10},
            durationSeconds: {min: 30, max: 1800, step: 30}
        }
    };
});
