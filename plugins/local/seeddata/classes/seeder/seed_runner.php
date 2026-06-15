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

use local_seeddata\data\json_loader;

/**
 * Coordinates the seed data import.
 *
 * @package   local_seeddata
 * @copyright 2026 José Carlos
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class seed_runner {

    /**
     * Runs the complete seed import.
     *
     * @return void
     */
    public function run(): void {
        cli_writeln('Starting Moodle seed data import...');

        $loader = new json_loader();
        $usersdata = $loader->load('users.json');
        $coursesdata = $loader->load('courses.json');

        $users = (new user_seeder())->seed($usersdata);
        $courses = (new course_seeder())->seed($coursesdata);
        (new enrolment_seeder())->seed($users, $courses);

        cli_writeln('Seed data import finished.');
    }
}
