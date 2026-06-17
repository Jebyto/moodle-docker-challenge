/**
 * Small UI state helpers for Pomodoro elements.
 *
 * @module     local_pomodoro/animations
 * @copyright  2026 José Carlos
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define([], function() {
    /**
     * Toggle the active visibility class on the floating button.
     *
     * @param {HTMLElement|null} element Floating button.
     * @param {Boolean} visible Whether the button should be visible.
     */
    const setFloatingVisible = function(element, visible) {
        if (element) {
            element.classList.toggle('is-visible', visible);
        }
    };

    /**
     * Toggle the floating panel open state.
     *
     * @param {HTMLElement|null} element Panel element.
     */
    const togglePanel = function(element) {
        if (element) {
            element.classList.toggle('is-open');
        }
    };

    /**
     * Open the floating panel.
     *
     * @param {HTMLElement|null} element Panel element.
     */
    const openPanel = function(element) {
        if (element) {
            element.classList.add('is-open');
        }
    };

    /**
     * Close the floating panel.
     *
     * @param {HTMLElement|null} element Panel element.
     */
    const closePanel = function(element) {
        if (element) {
            element.classList.remove('is-open');
        }
    };

    return {
        closePanel: closePanel,
        openPanel: openPanel,
        setFloatingVisible: setFloatingVisible,
        togglePanel: togglePanel
    };
});
