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
 * Creates seed users.
 *
 * @package   local_seeddata
 * @copyright 2026 José Carlos
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class user_seeder {

    /**
     * Creates users described in JSON data, skipping users that already exist.
     *
     * @param array $usersdata User seed data.
     * @return stdClass[] Users indexed by username.
     */
    public function seed(array $usersdata): array {
        global $DB, $CFG;

        $users = [];

        foreach ($usersdata as $userdata) {
            $this->require_fields($userdata, ['username', 'password', 'firstname', 'lastname', 'email']);

            $username = strtolower($userdata['username']);
            $existing = $DB->get_record('user', ['username' => $username, 'deleted' => 0]);

            if ($existing) {
                cli_writeln("User already exists: {$username}");
                $users[$username] = $existing;
                continue;
            }

            $user = (object) [
                'auth' => 'manual',
                'confirmed' => 1,
                'mnethostid' => $CFG->mnet_localhost_id,
                'username' => $username,
                'password' => $userdata['password'],
                'firstname' => $userdata['firstname'],
                'lastname' => $userdata['lastname'],
                'email' => strtolower($userdata['email']),
                'city' => $userdata['city'] ?? '',
                'country' => $userdata['country'] ?? 'BR',
                'lang' => 'en',
                'timezone' => '99',
            ];

            $user->id = user_create_user($user, false, false);
            cli_writeln("Created user: {$username}");

            $users[$username] = $DB->get_record('user', ['id' => $user->id], '*', MUST_EXIST);
        }

        return $users;
    }

    /**
     * Validates required user fields.
     *
     * @param array $userdata User seed data.
     * @param array $fields Required fields.
     * @return void
     */
    private function require_fields(array $userdata, array $fields): void {
        foreach ($fields as $field) {
            if (empty($userdata[$field])) {
                cli_error("Missing required user field '{$field}'.");
            }
        }
    }
}
