/**
 * DOM rendering and event wiring for the Pomodoro timer.
 *
 * @module     local_pomodoro/ui
 * @copyright  2026 José Carlos
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define([
    'local_pomodoro/animations',
    'local_pomodoro/settings'
], function(Animations, Settings) {
    let floatingButton = null;
    let floatingTime = null;
    let floatingPhase = null;
    let floatingCycle = null;
    let panel = null;
    let panelTime = null;
    let panelInlineTime = null;
    let panelPhase = null;
    let panelCycle = null;
    let panelPauseButton = null;

    // HTMLElement root => {root, mode, time, inlineTime, cycle, pauseButton, cancelButton}.
    const fullscreenRegions = new Map();

    // HTMLElement root => {root, mode, time, cycle}.
    const blockRegions = new Map();

    /**
     * Get a readable label for a timer mode.
     *
     * @param {String} mode Timer mode.
     * @param {Function} getString String resolver.
     * @returns {String} Mode label.
     */
    const getModeLabel = function(mode, getString) {
        return getString({
            short_break: 'shortbreak',
            long_break: 'longbreak'
        }[mode] || 'focus');
    };

    /**
     * Update the visible value for one range field.
     *
     * @param {HTMLInputElement} input Range input.
     */
    const updateRangeOutput = function(input) {
        const output = input.parentNode.querySelector('[data-pomodoro-range-output]');
        const key = input.dataset.pomodoroSettingField || input.dataset.pomodoroPanelField;

        if (output) {
            output.textContent = key.indexOf('DurationSeconds') !== -1 ?
                Settings.formatDurationLabel(input.value) :
                input.value;
        }
    };

    /**
     * Register live value updates for range fields.
     *
     * @param {HTMLElement} root Root element.
     */
    const registerRangeOutputs = function(root) {
        root.querySelectorAll('input[type="range"]').forEach(function(input) {
            updateRangeOutput(input);

            if (!input.dataset.pomodoroRangeBound) {
                input.dataset.pomodoroRangeBound = '1';
                input.addEventListener('input', function() {
                    updateRangeOutput(input);
                });
            }
        });
    };

    /**
     * Synchronise all visible settings forms with current settings.
     *
     * @param {Object} settings Settings.
     */
    const syncSettingsInputs = function(settings) {
        if (panel) {
            Settings.writeSettingsTo(panel, '[data-pomodoro-panel-field]', settings);
        }

        fullscreenRegions.forEach(function(region) {
            Settings.writeSettingsTo(region.root, '[data-pomodoro-setting-field]', settings);
        });

        blockRegions.forEach(function(region) {
            Settings.writeSettingsTo(region.root, '[data-pomodoro-setting-field]', settings);
        });
    };

    /**
     * Find the server-rendered floating UI and attach handlers once.
     *
     * @param {Object} options Rendering options and callbacks.
     */
    const ensureFloatingUi = function(options) {
        if (floatingButton && panel) {
            return;
        }

        floatingButton = document.querySelector('[data-pomodoro-floating]');
        panel = document.querySelector('[data-pomodoro-panel]');

        if (!floatingButton || !panel) {
            return;
        }

        floatingTime = floatingButton.querySelector('[data-pomodoro-floating-time]');
        floatingPhase = floatingButton.querySelector('[data-pomodoro-floating-phase]');
        floatingCycle = floatingButton.querySelector('[data-pomodoro-floating-cycle]');
        panelTime = panel.querySelector('[data-pomodoro-panel-time]');
        panelInlineTime = panel.querySelector('[data-pomodoro-panel-time-inline]');
        panelPhase = panel.querySelector('[data-pomodoro-panel-phase]');
        panelCycle = panel.querySelector('[data-pomodoro-panel-cycle]');
        panelPauseButton = panel.querySelector('[data-pomodoro-pause]');

        registerRangeOutputs(panel);
        floatingButton.addEventListener('click', function() {
            Animations.togglePanel(panel);
        });
        panel.querySelector('[data-pomodoro-panel-close]').addEventListener('click', function() {
            Animations.closePanel(panel);
        });
        panelPauseButton.addEventListener('click', options.togglePause);
        panel.querySelector('[data-pomodoro-cancel]').addEventListener('click', options.cancelSession);
        panel.querySelector('[data-pomodoro-save-settings]').addEventListener('click', function() {
            options.saveSettingsFrom(panel, '[data-pomodoro-panel-field]');
        });

        syncSettingsInputs(options.getSettings());
    };

    /**
     * Open the floating panel.
     */
    const openPanel = function() {
        Animations.openPanel(panel);
    };

    /**
     * Render all Pomodoro UI regions.
     *
     * @param {Object} state Timer state.
     * @param {String} formatted Formatted remaining time.
     * @param {Function} getString String resolver.
     */
    const render = function(state, formatted, getString) {
        const isActive = state.status !== 'idle';
        const modeLabel = getModeLabel(state.mode, getString);
        const pauseLabel = state.status === 'paused' ? getString('resume') : getString('pause');

        if (floatingButton && panel) {
            Animations.setFloatingVisible(floatingButton, isActive);

            if (!isActive) {
                Animations.closePanel(panel);
            }

            floatingTime.textContent = formatted;
            floatingPhase.textContent = modeLabel;
            floatingCycle.textContent = getString('currentcycle') + ' ' + state.currentCycle;
            panelTime.textContent = formatted;
            panelInlineTime.textContent = formatted;
            panelPhase.textContent = modeLabel;
            panelCycle.textContent = state.currentCycle;
            panelPauseButton.textContent = pauseLabel;
        }

        fullscreenRegions.forEach(function(region) {
            region.mode.textContent = modeLabel;
            region.time.textContent = formatted;
            region.inlineTime.textContent = formatted;
            region.cycle.textContent = state.currentCycle;
            region.pauseButton.textContent = pauseLabel;
            region.pauseButton.disabled = !isActive;
            region.cancelButton.disabled = !isActive;
        });

        blockRegions.forEach(function(region) {
            region.mode.textContent = modeLabel;
            region.time.textContent = formatted;
            region.cycle.textContent = state.currentCycle;
        });
    };

    /**
     * Register a block root and its event handlers.
     *
     * @param {HTMLElement} root Block root.
     * @param {Object} callbacks Event callbacks.
     */
    const addBlockRoot = function(root, callbacks) {
        if (blockRegions.has(root)) {
            return;
        }

        const region = {
            root: root,
            mode: root.querySelector('[data-pomodoro-block-mode]'),
            time: root.querySelector('[data-pomodoro-block-time]'),
            cycle: root.querySelector('[data-pomodoro-block-cycle]')
        };
        const startButton = root.querySelector('[data-pomodoro-block-start]');
        const saveButton = root.querySelector('[data-pomodoro-block-save]');
        const fullscreenLink = root.querySelector('[data-pomodoro-block-fullscreen]');

        blockRegions.set(root, region);
        registerRangeOutputs(root);
        syncSettingsInputs(callbacks.getSettings());

        if (startButton) {
            startButton.addEventListener('click', function() {
                callbacks.startSession(true, Settings.readSettingsFrom(root, '[data-pomodoro-setting-field]'));
            });
        }

        if (saveButton) {
            saveButton.addEventListener('click', function() {
                callbacks.saveSettingsFrom(root, '[data-pomodoro-setting-field]');
            });
        }

        if (fullscreenLink && callbacks.fullscreenUrl) {
            fullscreenLink.setAttribute('href', callbacks.fullscreenUrl);
        }
    };

    /**
     * Register a fullscreen root and its event handlers.
     *
     * @param {HTMLElement} root Fullscreen page root.
     * @param {Object} callbacks Event callbacks.
     */
    const addFullscreenRoot = function(root, callbacks) {
        if (fullscreenRegions.has(root)) {
            return;
        }

        const region = {
            root: root,
            mode: root.querySelector('[data-pomodoro-fullscreen-mode]'),
            time: root.querySelector('[data-pomodoro-fullscreen-time]'),
            inlineTime: root.querySelector('[data-pomodoro-fullscreen-time-inline]'),
            cycle: root.querySelector('[data-pomodoro-fullscreen-cycle]'),
            pauseButton: root.querySelector('[data-pomodoro-fullscreen-pause]'),
            cancelButton: root.querySelector('[data-pomodoro-fullscreen-cancel]')
        };

        fullscreenRegions.set(root, region);
        registerRangeOutputs(root);
        syncSettingsInputs(callbacks.getSettings());

        root.querySelector('[data-pomodoro-fullscreen-start]').addEventListener('click', function() {
            callbacks.startSession(false, Settings.readSettingsFrom(root, '[data-pomodoro-setting-field]'));
        });
        region.pauseButton.addEventListener('click', callbacks.togglePause);
        region.cancelButton.addEventListener('click', callbacks.cancelSession);
        root.querySelector('[data-pomodoro-fullscreen-save]').addEventListener('click', function() {
            callbacks.saveSettingsFrom(root, '[data-pomodoro-setting-field]');
        });
    };

    return {
        addBlockRoot: addBlockRoot,
        addFullscreenRoot: addFullscreenRoot,
        ensureFloatingUi: ensureFloatingUi,
        openPanel: openPanel,
        render: render,
        registerRangeOutputs: registerRangeOutputs,
        syncSettingsInputs: syncSettingsInputs
    };
});
