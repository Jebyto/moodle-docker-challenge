<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle. If not, see <http://www.gnu.org/licenses/>.

/**
 * Global callbacks for the Pomodoro local plugin.
 *
 * @package   local_pomodoro
 * @copyright 2026 José Carlos
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Returns whether the Pomodoro UI should be available on the current request.
 *
 * @return bool
 */
function local_pomodoro_should_bootstrap() {
    if (defined('CLI_SCRIPT') && CLI_SCRIPT) {
        return false;
    }

    return isloggedin() && !isguestuser();
}

/**
 * Returns language strings consumed by the AMD module.
 *
 * @return array
 */
function local_pomodoro_get_js_strings() {
    $keys = [
        'cancel',
        'closepanel',
        'currentcycle',
        'cyclecompletedbody',
        'expandtimer',
        'focus',
        'fullscreen',
        'longbreak',
        'openfullscreen',
        'pause',
        'remainingtime',
        'resume',
        'savesettings',
        'settings',
        'settingssaved',
        'shortbreak',
        'startpomodoro',
        'timercompleted',
        'cyclesbeforelongbreak',
    ];

    $strings = [];
    foreach ($keys as $key) {
        $strings[$key] = get_string($key, 'local_pomodoro');
    }

    return $strings;
}

/**
 * Loads the global Pomodoro UI for logged-in users.
 *
 * @return void
 */
function local_pomodoro_bootstrap() {
    global $PAGE;

    static $loaded = false;

    if ($loaded || !local_pomodoro_should_bootstrap()) {
        return;
    }

    $loaded = true;
    $pageurl = new moodle_url('/local/pomodoro/index.php');

    $PAGE->requires->css(new moodle_url('/local/pomodoro/styles.css'));
    $PAGE->requires->js_call_amd('local_pomodoro/timer', 'initGlobal', [
        local_pomodoro_get_js_strings(),
        $pageurl->out(false),
    ]);
}

/**
 * Callback used while building the global navigation.
 *
 * @param global_navigation $navigation
 * @return void
 */
function local_pomodoro_extend_navigation(global_navigation $navigation) {
    local_pomodoro_bootstrap();

    if (!local_pomodoro_should_bootstrap()) {
        return;
    }

    $navigation->add(
        get_string('pluginname', 'local_pomodoro'),
        new moodle_url('/local/pomodoro/index.php'),
        navigation_node::TYPE_CUSTOM,
        null,
        'local_pomodoro'
    );
}

/**
 * Callback used by Moodle before the footer is printed.
 *
 * @return string
 */
function local_pomodoro_before_footer() {
    global $OUTPUT;

    local_pomodoro_bootstrap();

    if (!local_pomodoro_should_bootstrap()) {
        return '';
    }

    $context = local_pomodoro_get_js_strings();
    $context['fullscreenurl'] = (new moodle_url('/local/pomodoro/index.php'))->out(false);

    return $OUTPUT->render_from_template('local_pomodoro/floating', $context);
}

/**
 * Callback used by Moodle before the standard HTML head is printed.
 *
 * @return string
 */
function local_pomodoro_before_standard_html_head() {
    local_pomodoro_bootstrap();

    return '';
}
