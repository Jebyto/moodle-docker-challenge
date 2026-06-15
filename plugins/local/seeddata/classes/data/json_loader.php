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

namespace local_seeddata\data;

defined('MOODLE_INTERNAL') || die();

/**
 * Loads JSON files from the plugin data directory.
 *
 * @package   local_seeddata
 * @copyright 2026 José Carlos
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class json_loader {

    /**
     * Loads and decodes a JSON file from the plugin data directory.
     *
     * @param string $filename JSON filename.
     * @return array
     */
    public function load(string $filename): array {
        $path = dirname(__DIR__, 2) . '/data/' . $filename;

        if (!is_readable($path)) {
            cli_error("Seed data file is not readable: {$path}");
        }

        $contents = file_get_contents($path);
        $data = json_decode($contents, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            cli_error("Invalid JSON in {$path}: " . json_last_error_msg());
        }

        return $data;
    }
}
