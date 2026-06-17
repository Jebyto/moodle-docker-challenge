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
 * Fullscreen Pomodoro page.
 *
 * @package   local_pomodoro
 * @copyright 2026 José Carlos
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Moodle 5.1+ may serve plugins from the public/ directory while config.php
// remains in the project root. Keep the second path as a fallback for older
// or non-public Moodle layouts.
$configpaths = [
    __DIR__ . '/../../../config.php',
    __DIR__ . '/../../config.php',
];

foreach ($configpaths as $configpath) {
    if (is_readable($configpath)) {
        require_once($configpath);
        break;
    }
}

defined('MOODLE_INTERNAL') || die('Moodle config.php could not be loaded.');

require_once(__DIR__ . '/lib.php');

require_login();

$context = context_system::instance();
$pageurl = new moodle_url('/local/pomodoro/index.php');

// Use a unique root id so the AMD module can attach behaviour to this exact
// rendered page instance without relying on a global selector.
$rootid = uniqid('local-pomodoro-fullscreen-');

$PAGE->set_context($context);
$PAGE->set_url($pageurl);
$PAGE->set_pagelayout('standard');
$PAGE->set_title(get_string('fullscreen', 'local_pomodoro'));
$PAGE->set_heading(get_string('fullscreen', 'local_pomodoro'));
$PAGE->requires->css(new moodle_url('/local/pomodoro/styles.css'));
$PAGE->requires->js_call_amd('local_pomodoro/timer', 'initFullscreen', [
    $rootid,
    local_pomodoro_get_js_strings(),
    $pageurl->out(false),
]);

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_pomodoro/fullscreen', [
    'rootid' => $rootid,
    'title' => get_string('fullscreen', 'local_pomodoro'),
    'subtitle' => get_string('fullscreensubtitle', 'local_pomodoro'),
    'focus' => get_string('focus', 'local_pomodoro'),
    'shortbreak' => get_string('shortbreak', 'local_pomodoro'),
    'longbreak' => get_string('longbreak', 'local_pomodoro'),
    'remainingtime' => get_string('remainingtime', 'local_pomodoro'),
    'currentcycle' => get_string('currentcycle', 'local_pomodoro'),
    'cyclesbeforelongbreak' => get_string('cyclesbeforelongbreak', 'local_pomodoro'),
    'startpomodoro' => get_string('startpomodoro', 'local_pomodoro'),
    'pause' => get_string('pause', 'local_pomodoro'),
    'cancel' => get_string('cancel', 'local_pomodoro'),
    'savesettings' => get_string('savesettings', 'local_pomodoro'),
]);
echo $OUTPUT->footer();
