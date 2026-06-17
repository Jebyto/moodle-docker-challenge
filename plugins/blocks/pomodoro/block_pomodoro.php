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
 * Pomodoro block entrypoint.
 *
 * @package   block_pomodoro
 * @copyright 2026 José Carlos
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Block that acts as an entrypoint for the global Pomodoro timer.
 */
class block_pomodoro extends block_base
{

    /**
     * Sets the block title.
     *
     * @return void
     */
    public function init()
    {
        $this->title = get_string('pluginname', 'block_pomodoro');
    }

    /**
     * Renders the block content and loads the timer JavaScript.
     *
     * @return stdClass
     */
    public function get_content()
    {
        global $OUTPUT, $PAGE;

        if ($this->content !== null) {
            return $this->content;
        }

        $rootid = uniqid('block-pomodoro-');
        $pageurl = new moodle_url('/local/pomodoro/index.php');

        $PAGE->requires->css(new moodle_url('/blocks/pomodoro/styles.css'));
        $PAGE->requires->js_call_amd('local_pomodoro/timer', 'initBlock', [
            $rootid,
            $this->get_js_strings(),
            $pageurl->out(false),
        ]);

        $this->content = new stdClass();
        $this->content->text = $OUTPUT->render_from_template('block_pomodoro/timer', [
            'rootid' => $rootid,
            'title' => get_string('title', 'block_pomodoro'),
            'subtitle' => get_string('subtitle', 'block_pomodoro'),
            'summary' => get_string('summary', 'block_pomodoro'),
            'focus' => get_string('focus', 'local_pomodoro'),
            'shortbreak' => get_string('shortbreak', 'local_pomodoro'),
            'longbreak' => get_string('longbreak', 'local_pomodoro'),
            'currentcycle' => get_string('currentcycle', 'local_pomodoro'),
            'cyclesbeforelongbreak' => get_string('cyclesbeforelongbreak', 'local_pomodoro'),
            'savesettings' => get_string('savesettings', 'local_pomodoro'),
            'startpomodoro' => get_string('startpomodoro', 'block_pomodoro'),
            'openfullscreen' => get_string('openfullscreen', 'block_pomodoro'),
            'fullscreenurl' => $pageurl->out(false),
        ]);
        $this->content->footer = '';

        return $this->content;
    }

    /**
     * Enables the block in regular Moodle pages.
     *
     * @return array
     */
    public function applicable_formats()
    {
        return [
            'all' => true,
            'my' => true,
            'course-view' => true,
            'site-index' => true,
        ];
    }

    /**
     * Keeps one Pomodoro block instance per page.
     *
     * @return bool
     */
    public function instance_allow_multiple()
    {
        return false;
    }

    /**
     * This MVP has no administrative configuration.
     *
     * @return bool
     */
    public function has_config()
    {
        return false;
    }

    /**
     * Language strings consumed by the AMD module.
     *
     * @return array
     */
    private function get_js_strings(): array
    {
        $keys = [
            'cancel',
            'closepanel',
            'currentcycle',
            'cyclecompletedbody',
            'cyclesbeforelongbreak',
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
        ];

        $strings = [];
        foreach ($keys as $key) {
            $strings[$key] = get_string($key, 'local_pomodoro');
        }

        return $strings;
    }
}
