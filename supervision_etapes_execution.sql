-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: supervision
-- ------------------------------------------------------
-- Server version	8.4.7

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `etapes_execution`
--

DROP TABLE IF EXISTS `etapes_execution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `etapes_execution` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cycle_id` int NOT NULL,
  `etape_recette_id` int NOT NULL,
  `numero_etape` int NOT NULL,
  `date_debut` timestamp NOT NULL,
  `date_fin` timestamp NULL DEFAULT NULL,
  `duree_reelle_sec` int DEFAULT NULL,
  `quantite_dosee` decimal(10,2) DEFAULT NULL,
  `consigne_atteinte` tinyint(1) DEFAULT '0',
  `valeur_critere` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` enum('EN_COURS','TERMINE','ERREUR','INTERROMPU') COLLATE utf8mb4_unicode_ci DEFAULT 'EN_COURS',
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_cycle` (`cycle_id`),
  KEY `idx_etape_recette` (`etape_recette_id`),
  KEY `idx_numero_etape` (`numero_etape`),
  KEY `idx_date_debut` (`date_debut`),
  KEY `idx_statut` (`statut`),
  CONSTRAINT `etapes_execution_ibfk_1` FOREIGN KEY (`cycle_id`) REFERENCES `cycles_production` (`id`) ON DELETE CASCADE,
  CONSTRAINT `etapes_execution_ibfk_2` FOREIGN KEY (`etape_recette_id`) REFERENCES `etapes_recette` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Détail d''exécution de chaque étape de cycle';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `etapes_execution`
--

LOCK TABLES `etapes_execution` WRITE;
/*!40000 ALTER TABLE `etapes_execution` DISABLE KEYS */;
/*!40000 ALTER TABLE `etapes_execution` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-08 15:48:37
