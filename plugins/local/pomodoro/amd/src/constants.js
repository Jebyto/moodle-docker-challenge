/**
 * Shared constants for the Pomodoro timer.
 *
 * @module     local_pomodoro/constants
 * @copyright  2026 José Carlos
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define([], function() {
    return {
        keys: {
            settings: 'pomodoro_settings',
            state: 'pomodoro_state',
            lastNotification: 'pomodoro_last_notification',
            activeTab: 'pomodoro_active_tab',
            tabId: 'pomodoro_tab_id'
        },
        leaderTtlMs: 6000
    };
});
