<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Custom Migration based on ToothalieDb2
 */
final class Version20260521131020 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Creates base schema and constraints for ToothalieDb2';
    }

    public function up(Schema $schema): void
    {
        // 1. CREATE ALL TABLES
        $this->addSql(<<<SQL
            CREATE TABLE `activity_log` (
              `id` int NOT NULL,
              `user_id` int NOT NULL,
              `username` varchar(100) NOT NULL,
              `role` varchar(50) NOT NULL,
              `action` varchar(50) NOT NULL,
              `target_data` longtext NOT NULL,
              `created_at` datetime NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

            CREATE TABLE `appointment` (
              `id` int NOT NULL,
              `appointment_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
              `emergency` tinyint(1) DEFAULT NULL,
              `user_set_date` varchar(50) DEFAULT NULL,
              `status` varchar(50) DEFAULT NULL,
              `message` varchar(200) DEFAULT NULL,
              `deleted_on` datetime DEFAULT NULL,
              `patient_id` int NOT NULL,
              `dentist_id` int NOT NULL,
              `schedule_id` int NOT NULL,
              `appointment_type_id` int DEFAULT NULL,
              `service_id` int DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

            CREATE TABLE `appointment_log` (
              `id` int NOT NULL,
              `logged_at` datetime NOT NULL,
              `actor_type` varchar(20) NOT NULL,
              `action` varchar(100) DEFAULT NULL,
              `message` longtext,
              `snapshot` json DEFAULT NULL,
              `appointment_id` int DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

            CREATE TABLE `appointment_type` (
              `id` int NOT NULL,
              `appointment_name` varchar(50) DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

            CREATE TABLE `dentist_service` (
              `id` int NOT NULL,
              `user_id` int NOT NULL,
              `service_id` int NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

            CREATE TABLE `estrellanes` (
              `id` int NOT NULL,
              `name` varchar(255) NOT NULL,
              `age` int NOT NULL,
              `yr_lvl` int NOT NULL,
              `course` varchar(255) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

            CREATE TABLE `reminder` (
              `id` int NOT NULL,
              `information` json NOT NULL,
              `viewed` tinyint(1) DEFAULT NULL,
              `appointment_id` int DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

            CREATE TABLE `role` (
              `id` int NOT NULL,
              `role_name` varchar(100) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

            CREATE TABLE `schedule` (
              `id` int NOT NULL,
              `day_of_week` varchar(20) NOT NULL,
              `time_slot` varchar(20) NOT NULL,
              `dentistID` int NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

            CREATE TABLE `service` (
              `id` int NOT NULL,
              `name` varchar(50) NOT NULL,
              `service_type_id` int NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

            CREATE TABLE `service_type` (
              `id` int NOT NULL,
              `name` varchar(50) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

            CREATE TABLE `user` (
              `id` int NOT NULL,
              `email` varchar(180) NOT NULL,
              `username` varchar(100) NOT NULL,
              `password` varchar(255) NOT NULL,
              `first_name` varchar(50) DEFAULT NULL,
              `last_name` varchar(50) DEFAULT NULL,
              `created_at` datetime DEFAULT NULL,
              `roles` json NOT NULL,
              `disable` tinyint(1) DEFAULT NULL,
              `is_verified` tinyint(1) NOT NULL,
              `verification_token` varchar(255) DEFAULT NULL,
              `fcm_token` varchar(255) DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

            CREATE TABLE `user_role` (
              `id` int NOT NULL,
              `user_id` int NOT NULL,
              `role_id` int NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        SQL);

        // 2. ADD INDEXES AND PRIMARY KEYS
        $this->addSql(<<<SQL
            ALTER TABLE `activity_log` ADD PRIMARY KEY (`id`);
            
            ALTER TABLE `appointment`
              ADD PRIMARY KEY (`id`),
              ADD KEY `IDX_FE38F8446B899279` (`patient_id`),
              ADD KEY `IDX_FE38F8441CE0A142` (`dentist_id`),
              ADD KEY `IDX_FE38F844A40BC2D5` (`schedule_id`),
              ADD KEY `IDX_FE38F844546FBEBB` (`appointment_type_id`),
              ADD KEY `IDX_FE38F844ED5CA9E6` (`service_id`);

            ALTER TABLE `appointment_log`
              ADD PRIMARY KEY (`id`),
              ADD KEY `IDX_206FFFDDE5B533F9` (`appointment_id`);

            ALTER TABLE `appointment_type` ADD PRIMARY KEY (`id`);

            ALTER TABLE `dentist_service`
              ADD PRIMARY KEY (`id`),
              ADD KEY `IDX_AFE90E7FA76ED395` (`user_id`),
              ADD KEY `IDX_AFE90E7FED5CA9E6` (`service_id`);

            ALTER TABLE `estrellanes` ADD PRIMARY KEY (`id`);

            ALTER TABLE `reminder`
              ADD PRIMARY KEY (`id`),
              ADD UNIQUE KEY `UNIQ_40374F40E5B533F9` (`appointment_id`);

            ALTER TABLE `role` ADD PRIMARY KEY (`id`);

            ALTER TABLE `schedule`
              ADD PRIMARY KEY (`id`),
              ADD KEY `IDX_5A3811FBDAEDB9B1` (`dentistID`);

            ALTER TABLE `service`
              ADD PRIMARY KEY (`id`),
              ADD KEY `IDX_E19D9AD2AC8DE0F` (`service_type_id`);

            ALTER TABLE `service_type` ADD PRIMARY KEY (`id`);

            ALTER TABLE `user`
              ADD PRIMARY KEY (`id`),
              ADD UNIQUE KEY `UNIQ_8D93D649F85E0677` (`username`),
              ADD UNIQUE KEY `UNIQ_IDENTIFIER_EMAIL` (`email`);

            ALTER TABLE `user_role`
              ADD PRIMARY KEY (`id`),
              ADD KEY `IDX_2DE8C6A3A76ED395` (`user_id`),
              ADD KEY `IDX_2DE8C6A3D60322AC` (`role_id`);
        SQL);

        // 3. SET AUTO_INCREMENTS
        $this->addSql(<<<SQL
            ALTER TABLE `activity_log` MODIFY `id` int NOT NULL AUTO_INCREMENT;
            ALTER TABLE `appointment` MODIFY `id` int NOT NULL AUTO_INCREMENT;
            ALTER TABLE `appointment_log` MODIFY `id` int NOT NULL AUTO_INCREMENT;
            ALTER TABLE `appointment_type` MODIFY `id` int NOT NULL AUTO_INCREMENT;
            ALTER TABLE `dentist_service` MODIFY `id` int NOT NULL AUTO_INCREMENT;
            ALTER TABLE `estrellanes` MODIFY `id` int NOT NULL AUTO_INCREMENT;
            ALTER TABLE `reminder` MODIFY `id` int NOT NULL AUTO_INCREMENT;
            ALTER TABLE `role` MODIFY `id` int NOT NULL AUTO_INCREMENT;
            ALTER TABLE `schedule` MODIFY `id` int NOT NULL AUTO_INCREMENT;
            ALTER TABLE `service` MODIFY `id` int NOT NULL AUTO_INCREMENT;
            ALTER TABLE `service_type` MODIFY `id` int NOT NULL AUTO_INCREMENT;
            ALTER TABLE `user` MODIFY `id` int NOT NULL AUTO_INCREMENT;
            ALTER TABLE `user_role` MODIFY `id` int NOT NULL AUTO_INCREMENT;
        SQL);

        // 4. ADD FOREIGN KEY CONSTRAINTS
        $this->addSql(<<<SQL
            ALTER TABLE `appointment`
              ADD CONSTRAINT `FK_FE38F8441CE0A142` FOREIGN KEY (`dentist_id`) REFERENCES `user` (`id`),
              ADD CONSTRAINT `FK_FE38F844546FBEBB` FOREIGN KEY (`appointment_type_id`) REFERENCES `appointment_type` (`id`),
              ADD CONSTRAINT `FK_FE38F8446B899279` FOREIGN KEY (`patient_id`) REFERENCES `user` (`id`),
              ADD CONSTRAINT `FK_FE38F844A40BC2D5` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`),
              ADD CONSTRAINT `FK_FE38F844ED5CA9E6` FOREIGN KEY (`service_id`) REFERENCES `service` (`id`);

            ALTER TABLE `appointment_log`
              ADD CONSTRAINT `FK_206FFFDDE5B533F9` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE CASCADE;

            ALTER TABLE `dentist_service`
              ADD CONSTRAINT `FK_AFE90E7FA76ED395` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
              ADD CONSTRAINT `FK_AFE90E7FED5CA9E6` FOREIGN KEY (`service_id`) REFERENCES `service` (`id`);

            ALTER TABLE `reminder`
              ADD CONSTRAINT `FK_40374F40E5B533F9` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`);

            ALTER TABLE `schedule`
              ADD CONSTRAINT `FK_5A3811FBDAEDB9B1` FOREIGN KEY (`dentistID`) REFERENCES `user` (`id`);

            ALTER TABLE `service`
              ADD CONSTRAINT `FK_E19D9AD2AC8DE0F` FOREIGN KEY (`service_type_id`) REFERENCES `service_type` (`id`);

            ALTER TABLE `user_role`
              ADD CONSTRAINT `FK_2DE8C6A3A76ED395` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
              ADD CONSTRAINT `FK_2DE8C6A3D60322AC` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`);
        SQL);

        // 5. INSERT ESSENTIAL BASE DATA
        $this->addSql(<<<SQL
            INSERT INTO `role` (`id`, `role_name`) VALUES (1, 'PATIENT'), (2, 'ADMIN'), (3, 'DENTIST');
            
            INSERT INTO `appointment_type` (`id`, `appointment_name`) VALUES (1, 'Normal'), (2, 'Family');
            
            INSERT INTO `service_type` (`id`, `name`) VALUES 
            (1, 'General Dentistry'), (2, 'Pediatric Dentistry'), (3, 'Orthodontics'), 
            (4, 'Cosmetic Dentistry'), (5, 'Oral Surgery'), (6, 'Periodontics');
            
            INSERT INTO `service` (`id`, `name`, `service_type_id`) VALUES 
            (1, 'Routine Checkup & Cleaning', 1), (2, 'Dental X-Ray (Panoramic)', 1), 
            (3, 'Fluoride Treatment', 1), (4, 'Child Dental Exam', 2), 
            (5, 'Sealants', 2), (6, 'Braces Consultation', 3), 
            (7, 'Invisalign Adjustment', 3), (8, 'Retainer Fitting', 3), 
            (9, 'Teeth Whitening', 4), (10, 'Veneers Consultation', 4), 
            (11, 'Composite Bonding', 4), (12, 'Wisdom Tooth Extraction', 5), 
            (13, 'Dental Implant Surgery', 5), (14, 'Deep Cleaning (Scaling)', 6), 
            (15, 'Gum Graft Surgery', 6);
        SQL);
    }

    public function down(Schema $schema): void
    {
        // Drop tables in reverse order of foreign key dependencies
        $this->addSql('DROP TABLE `appointment_log`');
        $this->addSql('DROP TABLE `reminder`');
        $this->addSql('DROP TABLE `appointment`');
        $this->addSql('DROP TABLE `dentist_service`');
        $this->addSql('DROP TABLE `schedule`');
        $this->addSql('DROP TABLE `service`');
        $this->addSql('DROP TABLE `user_role`');
        $this->addSql('DROP TABLE `activity_log`');
        $this->addSql('DROP TABLE `appointment_type`');
        $this->addSql('DROP TABLE `estrellanes`');
        $this->addSql('DROP TABLE `role`');
        $this->addSql('DROP TABLE `service_type`');
        $this->addSql('DROP TABLE `user`');
    }
}