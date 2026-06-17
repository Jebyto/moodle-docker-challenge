/**
 * Notification helpers for Pomodoro cycle completion.
 *
 * @module     local_pomodoro/notifications
 * @copyright  2026 José Carlos
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define([
    'core/notification',
    'local_pomodoro/constants',
    'local_pomodoro/storage'
], function(MoodleNotification, Constants, Storage) {
    /**
     * Play a short completion tone.
     */
    const playDoneSound = function() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) {
            return;
        }

        try {
            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const gain = context.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, context.currentTime);
            oscillator.frequency.setValueAtTime(660, context.currentTime + 0.18);
            gain.gain.setValueAtTime(0.001, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);

            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.48);
        } catch (error) {
            // Sound is best-effort and may be blocked by browser policies.
        }
    };

    /**
     * Show a browser notification when permission exists.
     *
     * @param {Function} getString String resolver.
     */
    const showBrowserNotification = function(getString) {
        if (!('Notification' in window) || window.Notification.permission !== 'granted') {
            return;
        }

        try {
            new window.Notification(getString('timercompleted'), {
                body: getString('cyclecompletedbody')
            });
        } catch (error) {
            // Browser notifications are optional.
        }
    };

    /**
     * Request browser notification permission.
     */
    const requestBrowserNotificationPermission = function() {
        if ('Notification' in window && window.Notification.permission === 'default') {
            window.Notification.requestPermission();
        }
    };

    /**
     * Show the Moodle completion alert.
     *
     * @param {Function} getString String resolver.
     */
    const showCyclePopup = function(getString) {
        MoodleNotification.alert(
            getString('timercompleted'),
            getString('cyclecompletedbody'),
            'OK'
        );
    };

    /**
     * Notify about a cycle completion exactly once across browser tabs.
     *
     * @param {Object} completedState Completed timer state.
     * @param {Function} getString String resolver.
     */
    const notifyCycleOnce = function(completedState, getString) {
        const notificationId = completedState.cycleId ||
            completedState.mode + ':' + completedState.currentCycle + ':' + completedState.endsAt;

        if (Storage.readString(Constants.keys.lastNotification) === notificationId) {
            return;
        }

        Storage.writeString(Constants.keys.lastNotification, notificationId);
        playDoneSound();
        showCyclePopup(getString);
        showBrowserNotification(getString);
    };

    return {
        notifyCycleOnce: notifyCycleOnce,
        requestBrowserNotificationPermission: requestBrowserNotificationPermission
    };
});
