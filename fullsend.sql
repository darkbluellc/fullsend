-- MySQL Script generated by MySQL Workbench
-- Tue Jul 19 14:19:58 2022
-- Model: New Model    Version: 1.0
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema fullsend
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema fullsend
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `fullsend` DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
USE `fullsend` ;

-- -----------------------------------------------------
-- Table `fullsend`.`carriers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `fullsend`.`carriers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `fullsend`.`contacts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `fullsend`.`contacts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL,
  `first_name` VARCHAR(45) NULL,
  `last_name` VARCHAR(45) NULL,
  `phone_number` VARCHAR(15) NOT NULL,
  `carrier` INT NOT NULL,
  `enabled` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `phone_number_UNIQUE` (`phone_number` ASC),
  INDEX `fk_contacts_user_id_idx` (`user_id` ASC),
  INDEX `fk_contacts_carrier_idx` (`carrier` ASC),
  CONSTRAINT `fk_contacts_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `fullsend`.`users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_contacts_carrier`
    FOREIGN KEY (`carrier`)
    REFERENCES `fullsend`.`carriers` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `fullsend`.`contacts_groups`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `fullsend`.`contacts_groups` (
  `contact_id` INT NOT NULL,
  `group_id` INT NOT NULL,
  `enabled` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`contact_id`, `group_id`),
  INDEX `fk_contacts_groups_group_idx` (`group_id` ASC),
  CONSTRAINT `fk_contacts_groups_contacts`
    FOREIGN KEY (`contact_id`)
    REFERENCES `fullsend`.`contacts` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_contacts_groups_group`
    FOREIGN KEY (`group_id`)
    REFERENCES `fullsend`.`groups` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `fullsend`.`groups`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `fullsend`.`groups` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `fullsend`.`messages`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `fullsend`.`messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL,
  `text` VARCHAR(2048) NULL,
  `sent_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_users_user_id_idx` (`user_id` ASC),
  CONSTRAINT `fk_users_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `fullsend`.`users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `fullsend`.`messages_groups`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `fullsend`.`messages_groups` (
  `message_id` INT NOT NULL,
  `group_id` INT NOT NULL,
  PRIMARY KEY (`message_id`, `group_id`),
  INDEX `fk_groups_id_idx` (`group_id` ASC),
  CONSTRAINT `fk_messages_id`
    FOREIGN KEY (`message_id`)
    REFERENCES `fullsend`.`messages` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_groups_id`
    FOREIGN KEY (`group_id`)
    REFERENCES `fullsend`.`groups` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `fullsend`.`sessions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `fullsend`.`sessions` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` INT NULL,
  `last_login` DATETIME NULL,
  `expiration` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC),
  INDEX `fk_users_user_id_idx` (`user_id` ASC),
  CONSTRAINT `fk_users_user_id`
    FOREIGN KEY (`user_id`)
    REFERENCES `fullsend`.`users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `fullsend`.`titles`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `fullsend`.`titles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `fullsend`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `fullsend`.`users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(45) NOT NULL,
  `last_name` VARCHAR(45) NOT NULL,
  `title` INT NULL,
  `username` VARCHAR(45) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `admin` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC),
  INDEX `fk_users_title_idx` (`title` ASC),
  CONSTRAINT `fk_users_title`
    FOREIGN KEY (`title`)
    REFERENCES `fullsend`.`titles` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
