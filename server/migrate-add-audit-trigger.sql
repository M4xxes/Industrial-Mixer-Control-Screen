-- Migration : audit_cycles + trigger de journalisation des changements de statut
-- À exécuter avec le client mysql (le DELIMITER ci-dessous ne fonctionne pas via
-- une connexion applicative simple type mysql2/node) :
--
--   mysql -u <utilisateur> -p supervision < server/migrate-add-audit-trigger.sql
--
-- Objectif (référentiel RNCP36463, BC01.10) : garantir un accès sécurisé aux données
-- en journalisant automatiquement toute anomalie/modification de statut d'un cycle
-- de production, sans intervention applicative (donc même en cas de bug côté API).

USE `supervision`;

-- Table d'audit : historise chaque changement de statut d'un cycle de production
CREATE TABLE IF NOT EXISTS `audit_cycles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cycle_id` INT NOT NULL,
  `ancien_statut` VARCHAR(20) DEFAULT NULL,
  `nouveau_statut` VARCHAR(20) NOT NULL,
  `date_changement` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_cycle` (`cycle_id`),
  CONSTRAINT `audit_cycles_ibfk_1` FOREIGN KEY (`cycle_id`) REFERENCES `cycles_production` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Journal des changements de statut des cycles de production (BC01.10)';

DROP TRIGGER IF EXISTS `trg_cycles_statut_audit`;

DELIMITER $$

CREATE TRIGGER `trg_cycles_statut_audit`
AFTER UPDATE ON `cycles_production`
FOR EACH ROW
BEGIN
  IF NOT (OLD.`statut` <=> NEW.`statut`) THEN
    INSERT INTO `audit_cycles` (`cycle_id`, `ancien_statut`, `nouveau_statut`)
    VALUES (NEW.`id`, OLD.`statut`, NEW.`statut`);
  END IF;
END$$

DELIMITER ;

-- Vérification manuelle après exécution :
--   UPDATE cycles_production SET statut = 'TERMINE' WHERE id = <un_id_existant>;
--   SELECT * FROM audit_cycles ORDER BY date_changement DESC LIMIT 5;
-- La ligne doit apparaître automatiquement, sans aucun code applicatif dédié.
