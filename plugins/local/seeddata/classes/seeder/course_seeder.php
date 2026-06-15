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
 * Creates the seed course category and courses.
 *
 * @package   local_seeddata
 * @copyright 2026 José Carlos
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class course_seeder {

    /**
     * Creates courses described in JSON data, skipping courses that already exist.
     *
     * @param array $coursesdata Course seed data.
     * @return stdClass[] Courses indexed by shortname.
     */
    public function seed(array $coursesdata): array {
        global $DB;

        $category = $this->get_category();
        $courses = [];

        foreach ($coursesdata as $coursedata) {
            $this->require_fields($coursedata, ['shortname', 'fullname', 'idnumber'], 'course');

            $shortname = $coursedata['shortname'];
            $existing = $DB->get_record('course', ['shortname' => $shortname]);

            if ($existing) {
                cli_writeln("Course already exists: {$shortname}");
                $courses[$shortname] = $existing;
                continue;
            }

            $course = (object) [
                'fullname' => $coursedata['fullname'],
                'shortname' => $shortname,
                'idnumber' => $coursedata['idnumber'],
                'category' => $category->id,
                'summary' => $coursedata['summary'] ?? '',
                'summaryformat' => FORMAT_HTML,
                'format' => 'topics',
                'visible' => 1,
            ];

            $course = create_course($course);
            cli_writeln("Created course: {$shortname}");

            $courses[$shortname] = $DB->get_record('course', ['id' => $course->id], '*', MUST_EXIST);
        }

        return $courses;
    }

    /**
     * Creates or returns the seed category.
     *
     * @return stdClass
     */
    private function get_category(): stdClass {
        global $DB;

        $idnumber = 'local_seeddata_courses';
        $category = $DB->get_record('course_categories', ['idnumber' => $idnumber]);

        if ($category) {
            cli_writeln("Course category already exists: {$category->name}");
            return $category;
        }

        $categorydata = (object) [
            'name' => 'Seed Courses',
            'idnumber' => $idnumber,
            'description' => 'Courses created by the local_seeddata CLI script.',
            'descriptionformat' => FORMAT_HTML,
            'parent' => 0,
            'visible' => 1,
        ];

        $category = \core_course_category::create($categorydata);
        cli_writeln("Created course category: {$category->name}");

        return $DB->get_record('course_categories', ['id' => $category->id], '*', MUST_EXIST);
    }

    /**
     * Validates required seed fields.
     *
     * @param array $data Seed item data.
     * @param array $fields Required fields.
     * @param string $type Seed item type used in error messages.
     * @return void
     */
    private function require_fields(array $data, array $fields, string $type): void {
        foreach ($fields as $field) {
            if (empty($data[$field])) {
                cli_error("Missing required {$type} field '{$field}'.");
            }
        }
    }
}
