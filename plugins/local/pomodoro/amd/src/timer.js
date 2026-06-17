/**
 * Main Pomodoro controller.
 *
 * This AMD module composes the smaller Pomodoro modules and exposes the public
 * initialisers called from PHP.
 *
 * @module     local_pomodoro/timer
 * @copyright  2026 José Carlos
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define([
    'core/toast',
    'local_pomodoro/constants',
    'local_pomodoro/default_settings',
    'local_pomodoro/settings',
    'local_pomodoro/tabs',
    'local_pomodoro/notifications',
    'local_pomodoro/time',
    'local_pomodoro/ui'
], function(Toast, Constants, Defaults, Settings, Tabs, Notifications, Time, Ui) {
    let strings = {};
    let fullscreenUrl = '';
    let intervalId = null;
    let globalReady = false;

    /**
     * Resolve a translated string passed from PHP.
     *
     * @param {String} key String identifier.
     * @returns {String} Translated string or the key itself.
     */
    const getString = function(key) {
        return strings[key] || key;
    };

    /**
     * Persist settings from a UI region and apply them to the current timer.
     *
     * @param {HTMLElement} root Root element containing setting inputs.
     * @param {String} selector Input selector.
     */
    const saveSettingsFrom = function(root, selector) {
        const settings = Settings.saveSettings(Settings.readSettingsFrom(root, selector));
        applySettingsToCurrentCycle(settings);
        Ui.syncSettingsInputs(settings);
        Toast.add(getString('settingssaved'), {type: 'success'});
        render();
    };

    /**
     * Render all visible timer regions.
     */
    const render = function() {
        const state = Time.getState();
        const settings = Settings.getSettings();
        const remaining = Time.getRemainingSeconds(state, settings);
        const formatted = Time.formatTime(remaining);

        Ui.render(state, formatted, getString);
    };

    /**
     * Start a new focus session.
     *
     * @param {Boolean} openPanel Whether to open the floating panel.
     * @param {Object} [settingsOverride] Optional settings read from the current UI.
     */
    const startSession = function(openPanel, settingsOverride) {
        const settings = settingsOverride ? Settings.saveSettings(settingsOverride) : Settings.getSettings();

        Notifications.requestBrowserNotificationPermission();
        Time.saveState(Time.buildCycleState('focus', 1, settings));

        if (openPanel) {
            Ui.openPanel();
        }

        render();
    };

    /**
     * Pause the running timer.
     */
    const pauseSession = function() {
        const state = Time.getState();
        const settings = Settings.getSettings();

        if (state.status !== 'running') {
            return;
        }

        Time.saveState(Object.assign({}, state, {
            status: 'paused',
            endsAt: null,
            pausedRemainingSeconds: Time.getRemainingSeconds(state, settings)
        }));
        render();
    };

    /**
     * Resume a paused timer.
     */
    const resumeSession = function() {
        const state = Time.getState();

        if (state.status !== 'paused') {
            return;
        }

        const remaining = Math.max(1, parseInt(state.pausedRemainingSeconds, 10) || 1);
        const now = Date.now();

        Time.saveState(Object.assign({}, state, {
            status: 'running',
            startedAt: now,
            endsAt: now + (remaining * 1000),
            pausedRemainingSeconds: null
        }));
        render();
    };

    /**
     * Toggle between paused and running.
     */
    const togglePause = function() {
        if (Time.getState().status === 'paused') {
            resumeSession();
            return;
        }

        pauseSession();
    };

    /**
     * Cancel the current session.
     */
    const cancelSession = function() {
        Time.saveState(Defaults.state);
        render();
    };

    /**
     * Recalculate the current cycle when settings change.
     *
     * @param {Object} settings New settings.
     */
    const applySettingsToCurrentCycle = function(settings) {
        const state = Time.getState();

        if (state.status === 'idle') {
            return;
        }

        const duration = Settings.getDurationSeconds(state.mode, settings);
        const now = Date.now();

        if (state.status === 'paused') {
            Time.saveState(Object.assign({}, state, {
                pausedRemainingSeconds: duration
            }));
            return;
        }

        Time.saveState(Object.assign({}, state, {
            startedAt: now,
            endsAt: now + (duration * 1000),
            pausedRemainingSeconds: null
        }));
    };

    /**
     * Complete the active cycle when the current tab is responsible.
     */
    const completeCycle = function() {
        const state = Time.getState();
        const settings = Settings.getSettings();

        if (state.status !== 'running' || Time.getRemainingSeconds(state, settings) > 0) {
            return;
        }

        if (!Tabs.claimLeadership()) {
            return;
        }

        Notifications.notifyCycleOnce(state, getString);

        const next = Time.getNextCycle(state, settings);
        Time.saveState(Time.buildCycleState(next.mode, next.currentCycle, settings));
        render();
    };

    /**
     * Tick the timer and render the current state.
     */
    const tick = function() {
        const state = Time.getState();
        const settings = Settings.getSettings();

        if (state.status === 'running' && Time.getRemainingSeconds(state, settings) <= 0) {
            completeCycle();
            return;
        }

        render();
    };

    /**
     * Start the one-second render interval.
     */
    const ensureInterval = function() {
        if (intervalId) {
            return;
        }

        intervalId = window.setInterval(tick, 1000);
    };

    /**
     * Configure cross-tab synchronisation.
     */
    const setupCrossTabSync = function() {
        window.addEventListener('storage', function(event) {
            if (event.key === Constants.keys.settings) {
                Ui.syncSettingsInputs(Settings.getSettings());
                render();
            } else if (event.key === Constants.keys.state) {
                render();
            }
        });
    };

    /**
     * Build shared callback options for UI modules.
     *
     * @returns {Object} UI callback options.
     */
    const getUiCallbacks = function() {
        return {
            cancelSession: cancelSession,
            fullscreenUrl: fullscreenUrl,
            getSettings: Settings.getSettings,
            getString: getString,
            saveSettingsFrom: saveSettingsFrom,
            startSession: startSession,
            togglePause: togglePause
        };
    };

    /**
     * Initialise the global floating Pomodoro UI.
     *
     * @param {Object} providedStrings Language strings.
     * @param {String} providedFullscreenUrl Fullscreen page URL.
     */
    const initGlobal = function(providedStrings, providedFullscreenUrl) {
        strings = Object.assign({}, strings, providedStrings || {});
        fullscreenUrl = providedFullscreenUrl || fullscreenUrl;

        if (!globalReady) {
            globalReady = true;
            setupCrossTabSync();
            Ui.ensureFloatingUi(getUiCallbacks());
            ensureInterval();
            Tabs.startLeaderHeartbeat();
        }

        render();
    };

    /**
     * Initialise a block entrypoint.
     *
     * @param {String} rootId Block root element ID.
     * @param {Object} providedStrings Language strings.
     * @param {String} providedFullscreenUrl Fullscreen page URL.
     */
    const initBlock = function(rootId, providedStrings, providedFullscreenUrl) {
        initGlobal(providedStrings, providedFullscreenUrl);

        const root = document.getElementById(rootId);
        if (!root) {
            return;
        }

        Ui.addBlockRoot(root, getUiCallbacks());
        render();
    };

    /**
     * Initialise the fullscreen Pomodoro page.
     *
     * @param {String} rootId Fullscreen root element ID.
     * @param {Object} providedStrings Language strings.
     * @param {String} providedFullscreenUrl Fullscreen page URL.
     */
    const initFullscreen = function(rootId, providedStrings, providedFullscreenUrl) {
        initGlobal(providedStrings, providedFullscreenUrl);

        const root = document.getElementById(rootId);
        if (!root) {
            return;
        }

        Ui.addFullscreenRoot(root, getUiCallbacks());
        render();
    };

    return {
        initBlock: initBlock,
        initFullscreen: initFullscreen,
        initGlobal: initGlobal
    };
});
