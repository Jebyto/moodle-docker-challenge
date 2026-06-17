/**
 * Browser tab leadership for Pomodoro notifications.
 *
 * @module     local_pomodoro/tabs
 * @copyright  2026 José Carlos
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['local_pomodoro/constants', 'local_pomodoro/storage'], function(Constants, Storage) {
    let tabId = null;
    let leaderIntervalId = null;

    /**
     * Create or read the current tab identifier.
     *
     * @returns {String} Tab identifier.
     */
    const createTabId = function() {
        try {
            const existing = window.sessionStorage.getItem(Constants.keys.tabId);
            if (existing) {
                return existing;
            }

            const next = 'tab-' + Date.now() + '-' + Math.random().toString(36).slice(2);
            window.sessionStorage.setItem(Constants.keys.tabId, next);
            return next;
        } catch (error) {
            return 'tab-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        }
    };

    /**
     * Get the current tab identifier.
     *
     * @returns {String} Tab identifier.
     */
    const getTabId = function() {
        if (!tabId) {
            tabId = createTabId();
        }

        return tabId;
    };

    /**
     * Claim notification leadership when no fresh leader exists.
     *
     * @returns {Boolean} Whether this tab is the current leader.
     */
    const claimLeadership = function() {
        const now = Date.now();
        const current = Storage.readJson(Constants.keys.activeTab, null);
        const currentTabId = getTabId();

        if (!current || current.tabId === currentTabId || !current.heartbeat ||
                now - current.heartbeat > Constants.leaderTtlMs) {
            Storage.writeJson(Constants.keys.activeTab, {
                tabId: currentTabId,
                heartbeat: now
            });
            return true;
        }

        return current.tabId === currentTabId;
    };

    /**
     * Start periodic leadership heartbeat.
     */
    const startLeaderHeartbeat = function() {
        if (leaderIntervalId) {
            return;
        }

        getTabId();
        leaderIntervalId = window.setInterval(claimLeadership, 2000);
        claimLeadership();
    };

    return {
        claimLeadership: claimLeadership,
        getTabId: getTabId,
        startLeaderHeartbeat: startLeaderHeartbeat
    };
});
