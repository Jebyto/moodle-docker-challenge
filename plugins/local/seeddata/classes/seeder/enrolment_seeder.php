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

namespace local_seeddata\seeder;

defined('MOODLE_INTERNAL') || die();

use stdClass;

/**
 * Enrols seed users into seed courses.
 *
 * @package   local_seeddata
 * @copyright 2026 José Carlos
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class enrolment_seeder {

    /**
     * Enrols every seeded user into every seeded course as student.
     *
     * @param stdClass[] $users Seed users.
     * @param stdClass[] $courses Seed courses.
     * @return void
     */
    public function seed(array $users, array $courses): void {
        global $DB;

        $manual = enrol_get_plugin('manual');

        if (!$manual) {
            cli_error('Manual enrolment plugin is not available.');
        }

        $studentrole = $DB->get_record('role', ['shortname' => 'student'], '*', MUST_EXIST);

        foreach ($courses as $course) {
            $instance = $this->get_manual_instance($course);

            foreach ($users as $user) {
                $params = [
                    'enrolid' => $instance->id,
                    'userid' => $user->id,
                ];
                $existing = $DB->get_record('user_enrolments', $params);

                if ($existing) {
                    cli_writeln("User {$user->username} already enrolled in {$course->shortname}");
                    continue;
                }

                $manual->enrol_user($instance, $user->id, $studentrole->id, time(), 0, ENROL_USER_ACTIVE);
                cli_writeln("Enrolled {$user->username} in {$course->shortname}");
            }
        }
    }

    /**
     * Returns a manual enrolment instance for a course, creating one when needed.
     *
     * @param stdClass $course Course record.
     * @return stdClass
     */
    private function get_manual_instance(stdClass $course): stdClass {
        global $DB;

        $instance = $DB->get_record('enrol', ['courseid' => $course->id, 'enrol' => 'manual']);

        if ($instance) {
            return $instance;
        }

        $manual = enrol_get_plugin('manual');

        if (!$manual) {
            cli_error('Manual enrolment plugin is not available.');
        }

        $instanceid = $manual->add_default_instance($course);

        return $DB->get_record('enrol', ['id' => $instanceid], '*', MUST_EXIST);
    }
}
