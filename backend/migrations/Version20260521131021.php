<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260521131021 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Seeds the database with dynamic user and appointment data (skipping base tables already seeded in the previous migration).';
    }

    public function up(Schema $schema): void
    {
        // Use Nowdoc (<<<'SQL') to safely pass JSON strings and escape characters exactly as they are in the dump.
        
        // 1. Independent Table (estrellanes)
        $this->addSql(<<<'SQL'
        INSERT INTO `estrellanes` (`id`, `name`, `age`, `yr_lvl`, `course`) VALUES
        (3, 'test', 0, 0, '');
        SQL);

        // 2. User Table 
        $this->addSql(<<<'SQL'
        INSERT INTO `user` (`id`, `email`, `username`, `password`, `first_name`, `last_name`, `created_at`, `roles`, `disable`, `is_verified`, `verification_token`, `fcm_token`) VALUES
        (1, 'orca@g.com', 'orca', '$2y$13$ENcIgiz4c5mCSrVkuQaCMuSvvmpZgtTDh4J997/d9amdPTx3/2dv2', 'orca', 'orca', '2026-01-11 13:51:57', '[\"ROLE_PATIENT\"]', NULL, 1, NULL, NULL),
        (2, 'admin@gmail.com', 'admin', '$2y$13$j2i8bK0bwQpZQwbqfCnrHe7HQ9Pwkusv4xJCTUiRsIGAk28u9uXKK', 'pro admin', 'ClintAdmin', NULL, '[\"ROLE_ADMIN\"]', 0, 1, NULL, NULL),
        (9, 'ding@g', 'ding', '$2y$13$qZEdYjL80/REg/GAY771runOeqU5djxxHgLmtTIXJS4INTagTrN42', 'ding', 'ding', '2026-01-17 11:16:18', '[\"ROLE_DENTIST\"]', 0, 0, NULL, NULL),
        (11, 'zom@gmail.com', 'zom', '$2y$13$1P7q7XztTEldDEPhxH2He.s.Npuolp4jHzNcWN41ZkFlGWnbiXVSq', 'Zom', 'Zom', '2026-03-13 15:09:12', '[\"ROLE_DENTIST\"]', 0, 0, 'de009b4b51900f937a6371a63ce3c1ced28944afd4beadb87d0d0de267519e5d', NULL),
        (13, 'dwad', 'Zom1', '$2y$13$hqcJGmo9VleUCfJhBlE1zu1Kx0QBG8vplEFos0KkWmuSm4q6AaGZi', 'Zom', 'Zom', '2026-03-13 15:23:52', '[\"ROLE_PATIENT\"]', NULL, 1, NULL, NULL),
        (15, 'awd', 'sean', '$2y$13$gvTohXFF0SMHN/b5CpEI9.XnlVbM3DdyLk0TIUSrLkOT3cHgCdsK2', 'Sean ', 'Paul', '2026-03-16 23:31:17', '[\"ROLE_PATIENT\"]', NULL, 1, NULL, NULL),
        (17, 'clint.estrellanes@norsu.edu.phawd', 'killer', '$2y$13$AUg6ig0/nrKGLDrSAveir.etatDkB8vMoNCbk2If2y5FqmYmO319y', 'killer', 'killer', '2026-03-22 09:09:41', '[\"ROLE_PATIENT\"]', NULL, 1, NULL, NULL),
        (22, 'clintjayestrellanes17@gmail.comawd', 'Bang Cay', '$2y$12$snxtLS0kwWrUbx59/zR7e.9BlKZ5GRSIyXf1ZfELrEqpIb1m5Y7lK', 'Zi Long', 'Ling Chong', '2026-03-29 22:41:07', '[\"ROLE_DENTIST\"]', 0, 1, NULL, NULL),
        (23, 'dentistemail', 'dentist', '$2y$13$7b2Xxbls19QVHg/kQBHhNeWvQ95fOzhuy4gfvF8Pb/a/di6v5Bsci', 'Zxuan ', 'Dentist', NULL, '[\"ROLE_DENTIST\"]', NULL, 1, NULL, 'c-y1U3OmTnemUgm6Q5ZInY:APA91bFFZ_Pmzdh51HEr3nbINsjsitbkrLTrL1XVMmNI-xwvHJI5zAmIGFDgKKObxjTz-dNWqmkYuumHBYNpojDJ0MiGDJMZzlemh9TWz9KNC8mISCPfU6I'),
        (24, 'patient', 'patient', '$2y$13$4HLC.Ula8MXusIo2RsJbd.fCmM6SEeC2hdFi1LCvRPoznIO..aHr2', 'Peter Parker', 'Patient', NULL, '[\"ROLE_PATIENT\"]', NULL, 1, NULL, 'c-y1U3OmTnemUgm6Q5ZInY:APA91bFFZ_Pmzdh51HEr3nbINsjsitbkrLTrL1XVMmNI-xwvHJI5zAmIGFDgKKObxjTz-dNWqmkYuumHBYNpojDJ0MiGDJMZzlemh9TWz9KNC8mISCPfU6I'),
        (101, 'mikaela.reyes@toothalie.com', 'dr_mikaela', '$2y$13$dummyhashedpasswordfortestingpurposesonly123', 'Mikaela', 'Reyes', '2026-04-02 06:44:39', '[\"ROLE_DENTIST\"]', 0, 1, NULL, NULL),
        (102, 'olivia.bennett@toothalie.com', 'dr_olivia', '$2y$13$dummyhashedpasswordfortestingpurposesonly123', 'Olivia', 'Bennett', '2026-04-02 06:44:39', '[\"ROLE_DENTIST\"]', 0, 1, NULL, NULL),
        (103, 'jamie.anderson@toothalie.com', 'dr_jamie', '$2y$13$dummyhashedpasswordfortestingpurposesonly123', 'Jamie', 'Anderson', '2026-04-02 06:44:39', '[\"ROLE_DENTIST\"]', 0, 1, NULL, NULL),
        (104, 'sophia.martinez@toothalie.com', 'dr_sophia', '$2y$13$dummyhashedpasswordfortestingpurposesonly123', 'Sophia', 'Martinez', '2026-04-02 06:44:39', '[\"ROLE_DENTIST\"]', 0, 1, NULL, NULL),
        (105, 'hana.sy@toothalie.com', 'dr_hana', '$2y$13$dummyhashedpasswordfortestingpurposesonly123', 'Hana', 'Sy', '2026-04-02 06:44:39', '[\"ROLE_DENTIST\"]', 0, 1, NULL, NULL),
        (106, 'liana.chen@toothalie.com', 'dr_liana', '$2y$13$dummyhashedpasswordfortestingpurposesonly123', 'Liana', 'Chen', '2026-04-02 06:44:39', '[\"ROLE_DENTIST\"]', 0, 1, NULL, NULL),
        (111, 'pafoke7055@azucore.com', 'clintdentist', '$2y$12$.MCjb6NaQ0J5i850.rhAr.jOOg0h9hOZXJU/fB4EpIwPPsrUsf1ZC', 'clintdentist', 'clintdentist', '2026-04-07 08:38:19', '[\"ROLE_DENTIST\"]', 0, 0, NULL, NULL),
        (114, 'clint.estrellanes@norsu.edu.ph', 'Clint_Jay_Estrellanes', '6ef00bcf268f244a862f5da754337087', 'Clint Jay', 'Estrellanes', '2026-04-07 11:08:49', '[\"ROLE_PATIENT\"]', NULL, 1, NULL, NULL),
        (116, 'clintjayestrellanes17@gmail.com', 'ESTRELLANES,_CLINT_JAY_C.', '9946c76175e851f3fed2a777d006ac7c', 'ESTRELLANES, CLINT JAY C.', NULL, '2026-04-23 12:55:07', '[\"ROLE_PATIENT\"]', NULL, 1, NULL, NULL),
        (118, 'orchestracyanide@gmail.com', 'orchestra_cyanide', 'e01e55540004675637dbb90904cdd5a3', 'orchestra', 'cyanide', '2026-05-16 13:21:28', '[\"ROLE_PATIENT\"]', NULL, 1, NULL, NULL),
        (122, 'fohep92934@getasail.com', 'johnpork', '$2y$13$FMCoQuyIbZ7NOBp8khEh4eLepV4H2tRei1YoroxFzu8I5MGZxfUNO', 'John', 'Pork', '2026-05-16 13:51:29', '[\"ROLE_PATIENT\"]', NULL, 1, NULL, NULL),
        (123, 'bowivi7410@bitmah.com', 'dingle', '$2y$13$RrboEhaBT3R8LuKhBUubb.jUQUYuPU7n0xWktwtwVF0m.SZRHK5lK', 'Dingle', 'Dingle', '2026-05-17 14:06:45', '[\"ROLE_PATIENT\"]', NULL, 1, NULL, 'c-y1U3OmTnemUgm6Q5ZInY:APA91bFFZ_Pmzdh51HEr3nbINsjsitbkrLTrL1XVMmNI-xwvHJI5zAmIGFDgKKObxjTz-dNWqmkYuumHBYNpojDJ0MiGDJMZzlemh9TWz9KNC8mISCPfU6I');
        SQL);

        // 3. Schedule Table
        $this->addSql(<<<'SQL'
        INSERT INTO `schedule` (`id`, `day_of_week`, `time_slot`, `dentistID`) VALUES
        (9, 'Monday', '09:00-10:00', 9),
        (11, 'Monday', '09:00-10:00', 9),
        (12, 'Monday', 'Hello World', 9),
        (13, 'Saturday', '12:00PM- 1:00PM', 9),
        (14, 'Tuesday', '09:00-10:00', 9),
        (17, 'Monday', '09:00-10:00', 101),
        (18, 'Monday', '10:00-11:00', 101),
        (19, 'Wednesday', '13:00-14:00', 101),
        (20, 'Tuesday', '09:00-10:00', 102),
        (21, 'Thursday', '14:00-15:00', 102),
        (22, 'Thursday', '15:00-16:00', 102),
        (23, 'Monday', '11:00-12:00', 103),
        (24, 'Friday', '09:00-10:00', 103),
        (25, 'Wednesday', '09:00-10:00', 104),
        (26, 'Wednesday', '10:00-11:00', 104),
        (27, 'Saturday', '10:00-12:00', 104),
        (28, 'Tuesday', '13:00-14:00', 105),
        (29, 'Thursday', '09:00-10:00', 105),
        (30, 'Monday', '14:00-15:00', 106),
        (31, 'Friday', '13:00-15:00', 106),
        (49, 'Monday', '02:00-03:00', 23),
        (53, 'Monday', '02:00-10:00', 23),
        (55, 'Monday', '09:00-10:00', 23);
        SQL);

        // 4. Dentist Service mapping
        $this->addSql(<<<'SQL'
        INSERT INTO `dentist_service` (`id`, `user_id`, `service_id`) VALUES
        (1, 9, 4),
        (2, 9, 14),
        (3, 9, 2),
        (4, 23, 1),
        (5, 23, 4),
        (6, 23, 6),
        (7, 23, 9),
        (8, 23, 12),
        (10, 101, 1),
        (11, 101, 13),
        (12, 102, 9),
        (13, 102, 10),
        (14, 102, 11),
        (15, 103, 12),
        (16, 103, 13),
        (17, 104, 6),
        (18, 104, 7),
        (19, 104, 8),
        (20, 105, 1),
        (21, 105, 2),
        (22, 106, 14),
        (23, 106, 15),
        (27, 23, 5),
        (29, 23, 10),
        (30, 23, 13),
        (33, 23, 14);
        SQL);

        // 5. Appointment
        $this->addSql(<<<'SQL'
        INSERT INTO `appointment` (`id`, `appointment_date`, `emergency`, `user_set_date`, `status`, `message`, `deleted_on`, `patient_id`, `dentist_id`, `schedule_id`, `appointment_type_id`, `service_id`) VALUES
        (4, '2026-01-17 05:36:06', 0, '2026-01-26', 'Approved', 'niggers', NULL, 1, 9, 9, 1, 4),
        (5, '2026-01-17 05:39:48', 0, '2026-01-26', 'Rejected', 'dawdawd', NULL, 1, 9, 9, 2, 4),
        (11, '2026-03-02 12:34:32', 1, 'Tomorrow', 'Approved', 'Nice', NULL, 1, 9, 9, 1, 1),
        (12, '2026-04-01 03:56:43', 1, '2026-04-18', 'Pending', 'Contact: Zombie Zombie (09453232376) | Note: some zombie', NULL, 1, 9, 13, 2, 2),
        (14, '2026-04-04 14:51:22', 0, '2026-04-22', 'Pending', 'Contact: Peter Parker Patient (patient) | Note: Nice', '2026-04-04 22:52:10', 24, 104, 26, 1, 8),
        (17, '2026-04-05 02:16:13', 0, '2026-04-29', 'Pending', 'sing a song', '2026-04-05 10:17:00', 24, 104, 25, 2, 8),
        (18, '2026-04-07 03:10:39', 0, '2026-04-16', 'Pending', 'Contact: Clint Jay Estrellanes (clint.estrellanes@norsu.edu.ph)', NULL, 114, 105, 29, 1, 1),
        (20, '2026-04-30 07:28:06', 0, '2026-05-25', 'Pending', 'Fuckkkkk', '2026-04-30 15:28:34', 24, 9, 9, 1, 4),
        (38, '2026-05-16 07:46:56', 0, '2026-06-08', 'Pending', 'Secret uwu', '2026-05-16 19:08:06', 24, 23, 49, 1, 5),
        (39, '2026-05-16 09:44:06', 0, '2026-05-18', 'Pending', 'Hello', '2026-05-16 19:07:38', 24, 23, 53, 2, 1),
        (40, '2026-05-16 11:14:12', 0, '2026-05-25', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-16 19:14:43', 24, 23, 53, 1, 1),
        (41, '2026-05-16 11:33:31', 0, '2026-05-25', 'Pending', 'Contact: ESTRELLANES, CLINT JAY C. N/A (clintjayestrellanes17@gmail.com)', '2026-05-20 17:17:02', 116, 23, 49, 1, 1),
        (42, '2026-05-16 12:45:45', 1, '2026-05-25', 'Rejected', 'Type shi', NULL, 24, 23, 53, 2, 9),
        (43, '2026-05-16 16:36:54', 0, '2026-05-25', 'Approved', 'Contact: Peter Parker Patient (patient)', NULL, 24, 23, 49, 2, 1),
        (44, '2026-05-17 06:10:19', 1, '2026-05-18', 'Rejected', 'suppp cuhz', '2026-05-17 14:27:51', 123, 23, 53, 1, 1),
        (45, '2026-05-17 06:30:46', 0, '2026-05-18', 'Pending', '', '2026-05-17 14:31:05', 123, 23, 49, 1, 1),
        (46, '2026-05-17 06:40:18', 0, '2026-05-18', 'Rejected', '', '2026-05-17 15:56:07', 123, 23, 49, 1, 1),
        (47, '2026-05-17 06:45:46', 0, '2026-05-18', 'Pending', 'Contact: Peter Parker Patient (patient) | Note: sss', '2026-05-17 14:46:04', 24, 23, 49, 1, 1),
        (48, '2026-05-17 06:46:43', 0, '2026-05-25', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-17 14:47:11', 24, 23, 49, 1, 1),
        (49, '2026-05-17 06:50:44', 0, '2026-05-25', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-17 14:52:26', 24, 23, 49, 1, 1),
        (50, '2026-05-17 06:50:51', 0, '2026-05-25', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-17 14:51:53', 24, 23, 49, 1, 1),
        (51, '2026-05-17 06:58:32', 1, '2026-05-25', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-17 14:59:07', 24, 23, 49, 1, 1),
        (52, '2026-05-17 06:59:36', 0, '2026-05-25', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-17 14:59:43', 24, 23, 49, 1, 1),
        (53, '2026-05-17 07:01:06', 1, '2026-05-18', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-17 15:14:26', 24, 23, 49, 1, 1),
        (54, '2026-05-17 07:02:32', 0, '2026-05-25', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-17 15:02:42', 24, 23, 49, 1, 1),
        (55, '2026-05-17 07:05:08', 0, '2026-05-18', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-17 15:05:22', 24, 23, 53, 1, 1),
        (56, '2026-05-17 07:09:14', 1, '2026-05-18', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-17 15:09:51', 24, 23, 53, 1, 1),
        (57, '2026-05-17 07:11:28', 0, '2026-05-25', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-17 15:11:37', 24, 23, 53, 1, 1),
        (58, '2026-05-17 07:14:42', 0, '2026-05-25', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-17 15:33:23', 24, 23, 49, 1, 1),
        (59, '2026-05-17 07:32:22', 0, '2026-05-25', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-17 15:33:12', 24, 23, 53, 1, 1),
        (60, '2026-05-17 07:33:42', 0, '2026-05-25', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-19 20:23:25', 24, 23, 53, 1, 1),
        (61, '2026-05-17 07:37:11', 1, '2026-05-18', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-17 15:55:30', 24, 23, 49, 1, 1),
        (62, '2026-05-17 07:56:30', 0, '2026-05-25', 'Rejected', 'Contact: Dingle Dingle (bowivi7410@bitmah.com)', NULL, 123, 23, 53, 1, 1),
        (63, '2026-05-17 08:07:30', 1, '2026-05-18', 'Rejected', '', NULL, 123, 23, 49, 2, 1),
        (64, '2026-05-19 12:03:16', 0, '2026-05-25', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-19 20:06:19', 24, 23, 49, 1, 1),
        (65, '2026-05-19 12:09:52', 0, '2026-05-25', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-19 20:22:21', 24, 23, 53, 1, 1),
        (66, '2026-05-19 12:24:58', 0, '2026-05-25', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-19 20:51:39', 24, 23, 49, 1, 1),
        (67, '2026-05-19 13:18:26', 0, '2026-05-25', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-19 21:24:11', 24, 23, 49, 1, 1),
        (68, '2026-05-19 13:25:26', 0, '2026-05-25', 'Pending', 'Contact: Peter Parker Patient (patient)', '2026-05-19 21:25:37', 24, 23, 53, 1, 1),
        (69, '2026-05-19 13:30:09', 0, '2026-05-25', 'Pending', 'Contact: Peter Parker Patientmmm (patient)xnsnsjdjdjd', '2026-05-19 22:15:43', 24, 23, 53, 1, 1),
        (70, '2026-05-19 13:43:21', 0, '2026-05-25', 'Pending', '', '2026-05-19 21:44:51', 24, 23, 49, 1, 1),
        (71, '2026-05-19 13:56:50', 0, '2026-05-25', 'Pending', 'Jjnj', '2026-05-19 22:01:20', 24, 23, 53, 1, 1),
        (72, '2026-05-19 14:03:58', 0, '2026-05-25', 'Pending', '', '2026-05-19 22:04:23', 24, 23, 49, 1, 1),
        (73, '2026-05-19 14:20:50', 0, '2026-05-25', 'Approved', '', '2026-05-20 00:03:10', 24, 23, 49, 1, 1),
        (74, '2026-05-19 14:21:24', 0, '2026-05-25', 'Pending', '', '2026-05-19 22:21:40', 24, 23, 49, 1, 1),
        (75, '2026-05-19 16:01:55', 1, '2026-05-25', 'Pending', 'Supp cuh', '2026-05-20 00:02:54', 24, 23, 49, 1, 1),
        (76, '2026-05-19 16:03:35', 0, '2026-05-25', 'Pending', '', '2026-05-20 00:03:44', 24, 23, 49, 1, 1),
        (77, '2026-05-19 16:05:02', 0, '2026-05-25', 'Approved', 'Contact: Peter Parker Patient (patient)', NULL, 24, 23, 49, 1, 1),
        (78, '2026-05-20 09:12:39', 1, '2026-05-25', 'Pending', 'Test', '2026-05-20 17:13:58', 24, 23, 55, 2, 4),
        (79, '2026-05-20 09:19:54', 0, '2026-05-25', 'Pending', '', NULL, 114, 23, 49, 1, 1);
        SQL);

        // 6. Reminder
        $this->addSql(<<<'SQL'
        INSERT INTO `reminder` (`id`, `information`, `viewed`, `appointment_id`) VALUES
        (1, '\"[{\\\"id\\\":\\\"4\\\",\\\"date\\\":\\\"2026-01-22\\\",\\\"slots\\\":[{\\\"endTime\\\":\\\"22:22\\\",\\\"message\\\":\\\"para\\\",\\\"startTime\\\":\\\"22:22\\\"}]},{\\\"id\\\":\\\"6q0fhue4q\\\",\\\"date\\\":\\\"2026-01-14\\\",\\\"slots\\\":[{\\\"startTime\\\":\\\"22:22\\\",\\\"endTime\\\":\\\"22:22\\\",\\\"message\\\":\\\"awd\\\"}]}]\"', 0, 4),
        (8, '[{\"id\": \"c10c2b23-701a-4253-805a-d6bf89cea7e4\", \"date\": \"2026-05-18\", \"slots\": [{\"endTime\": \"05:00\", \"message\": \"Drink some capsule\", \"startTime\": \"04:30\"}]}]', NULL, 46),
        (9, '[{\"id\": \"b3701622-92a1-495e-97ee-abd03fd48554\", \"date\": \"2026-05-20\", \"slots\": [{\"endTime\": \"06:00\", \"message\": \"eat paracetamols\", \"startTime\": \"05:00\"}]}]', NULL, 73);
        SQL);
    }

    public function down(Schema $schema): void
    {
        // Only truncate the tables populated in this specific migration file
        $this->addSql('SET FOREIGN_KEY_CHECKS = 0');
        
        $this->addSql('TRUNCATE TABLE `reminder`');
        $this->addSql('TRUNCATE TABLE `appointment`');
        $this->addSql('TRUNCATE TABLE `dentist_service`');
        $this->addSql('TRUNCATE TABLE `schedule`');
        $this->addSql('TRUNCATE TABLE `user`');
        $this->addSql('TRUNCATE TABLE `estrellanes`');
        
        $this->addSql('SET FOREIGN_KEY_CHECKS = 1');
    }
}