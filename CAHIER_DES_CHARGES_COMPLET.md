# CAHIER DES CHARGES TECHNIQUE

## Système de Supervision Multi-Malaxeurs

**Solution Complète de Contrôle Industriel**

6 Malaxeurs • Supervision Temps Réel • Gestion Recettes • Mode Manuel • Gestion Stocks

Interface Web Moderne • Architecture Évolutive

Version 2.0 - Intégration Interface Figma

Janvier 2026

---

# TABLE DES MATIÈRES

1. [CONTEXTE ET OBJECTIFS](#1-contexte-et-objectifs)
2. [ARCHITECTURE TECHNIQUE](#2-architecture-technique)
3. [AUTOMATISME ET COMMUNICATION](#3-automatisme-et-communication)
4. [BASE DE DONNÉES](#4-base-de-données)
5. [GESTION DES RECETTES](#5-gestion-des-recettes)
6. [INTERFACE DE SUPERVISION](#6-interface-de-supervision)
7. [FONCTIONNALITÉS AVANCÉES](#7-fonctionnalités-avancées)
8. [MÉTHODOLOGIE ET PLANNING](#8-méthodologie-et-planning)

---

# 1. CONTEXTE ET OBJECTIFS

## 1.1 Situation Actuelle

Le site de production dispose actuellement de 6 malaxeurs industriels organisés en 3 groupes de 2 malaxeurs, chacun contrôlé par un automate Schneider M221. En complément, deux automates M221 dédiés gèrent respectivement le dosage des liquides (D10, D200, Huile) et le dosage des poudres. Dans le cadre de ce projet, un nouvel automate Siemens S7-1513 sera ajouté pour servir de cadenceur central, coordonnant l'ensemble des 5 automates M221 existants.

### Configuration existante sur site :

| Système | Fonction | Automate |
|---------|----------|----------|
| Groupe B12 | Malaxeurs B1 et B2 | Schneider M221 #1 |
| Groupe B35 | Malaxeurs B3 et B5 | Schneider M221 #2 |
| Groupe B67 | Malaxeurs B6 et B7 | Schneider M221 #3 |
| Système Liquides | Dosage D10, D200, Huile | Schneider M221 #4 |
| Système Poudres | Dosage poudres | Schneider M221 #5 |

### Nouvel équipement à ajouter :

| Système | Fonction | Automate |
|---------|----------|----------|
| Cadenceur Central | Coordination générale + Interface supervision | Siemens S7-1513 (NOUVEAU) |

Le système de supervision actuel présente des limitations importantes en termes d'évolutivité et de maintenabilité.

## 1.2 Problématiques Identifiées

- Système de supervision vieillissant et difficile à maintenir
- Interface utilisateur obsolète ne répondant plus aux besoins opérationnels
- Coût élevé et délais importants pour toute modification ou évolution
- Technologies propriétaires créant une dépendance forte à l'éditeur
- Manque de flexibilité pour intégrer de nouvelles fonctionnalités
- Difficulté d'accès aux données historiques de production
- Absence de centralisation de la gestion des recettes
- Absence de suivi des stocks et consommations
- Pas de mode manuel pour contrôle étape par étape

## 1.3 Objectifs du Projet

Le projet vise à remplacer le système actuel par une solution moderne, évolutive et indépendante permettant de :

- ✅ Contrôler les 6 malaxeurs depuis une interface web unique et moderne
- ✅ Gérer facilement les recettes de production en base de données centralisée
- ✅ Suivre la production en temps réel avec une interface intuitive
- ✅ Faciliter les modifications et évolutions futures du système
- ✅ Améliorer la traçabilité et la qualité de la production
- ✅ Réduire les coûts de maintenance et d'évolution
- ✅ Garantir l'autonomie et l'indépendance technologique
- ✅ Ajouter la fonctionnalité de pesage de produit manuel
- ✅ **NOUVEAU** : Mode manuel pour contrôle étape par étape des recettes
- ✅ **NOUVEAU** : Gestion complète des stocks avec alertes de consommation
- ✅ **NOUVEAU** : Suivi détaillé des étapes de recette avec poids dosés/à doser
- ✅ **NOUVEAU** : Historique complet des lots avec graphiques et analyses

---

# 2. ARCHITECTURE TECHNIQUE

## 2.1 Vue d'Ensemble

L'architecture du système est organisée en trois niveaux hiérarchiques assurant une séparation claire des responsabilités et une maintenance facilitée.

| Niveau | Fonction | Technologies |
|--------|----------|--------------|
| Niveau Supervision | Interface Web + Backend + Base de Données | React, Node-RED, PostgreSQL |
| Niveau Coordination | Automate Cadenceur Central | Siemens S7-1513 (NOUVEAU) |
| Niveau Exécution | Automates Métier (×5) | Schneider M221 (existants) |

### Détail du niveau exécution (5 automates M221 existants) :

1. M221 Malaxeurs B1/B2
2. M221 Malaxeurs B3/B5
3. M221 Malaxeurs B6/B7
4. M221 Gestion Liquides (D10, D200, Huile)
5. M221 Gestion Poudres

## 2.2 Niveau Supervision

Ce niveau comprend trois composants principaux :

### Interface Web (React)

- Interface utilisateur responsive et moderne
- Visualisation multi-malaxeurs en temps réel
- Gestion des recettes (CRUD complet)
- Affichage des alarmes et événements
- Historisation et traçabilité
- **Mode manuel** pour contrôle étape par étape
- **Gestion des stocks** avec alertes
- **Suivi détaillé** des étapes de production
- **Historique complet** avec graphiques

### Backend API (Node-RED)

- API REST pour la gestion des données
- Communication temps réel via WebSocket
- Gestion de la communication OPC UA
- Orchestration des flux de données
- Gestion des alarmes et événements
- Synchronisation des stocks
- Traçabilité des consommations

### Base de Données (PostgreSQL)

- Stockage des recettes de production
- Historique complet des cycles
- Traçabilité des données
- Gestion des utilisateurs et droits
- Logs système et alarmes
- **Gestion des stocks** et seuils
- **Historique des lots** avec données détaillées

## 2.3 Niveau Coordination

Le niveau coordination est assuré par le nouvel automate cadenceur Siemens S7-1513. Cet automate centralise toutes les communications et coordonne les 5 automates M221 existants.

### Rôles du cadenceur S7-1513 :

- Interface unique avec la supervision (OPC UA)
- Coordination des 5 automates M221 via Modbus TCP
- Orchestration globale de la production
- Gestion des priorités entre malaxeurs
- Synchronisation des dosages liquides et poudres
- Agrégation des données en temps réel
- Centralisation des alarmes et défauts
- Sécurité du processus global
- Distribution des recettes aux automates concernés

### Communication :

- Vers le haut : OPC UA avec la supervision (bidirectionnel)
- Vers le bas : Modbus TCP avec les 5 M221 (bidirectionnel)

## 2.4 Niveau Exécution

Le niveau exécution comprend 5 automates Schneider M221 existants, chacun dédié à une fonction spécifique :

### A. M221 Malaxeurs B1/B2

- Contrôle local des malaxeurs B1 et B2
- Gestion des actionneurs (bras, vis, refroidissement)
- Lecture capteurs et états
- Exécution des étapes de recette
- Remontée données vers cadenceur

### B. M221 Malaxeurs B3/B5

Mêmes fonctions que M221 B1/B2 pour les malaxeurs B3 et B5

### C. M221 Malaxeurs B6/B7

Mêmes fonctions que M221 B1/B2 pour les malaxeurs B6 et B7

### D. M221 Gestion Liquides

- Gestion du dosage D10 pour tous les malaxeurs
- Gestion du dosage D200 pour malaxeurs B1, B2, B5, B6, B7
- Gestion du dosage Huile pour tous les malaxeurs
- Contrôle des trémies de liquides
- Remontée données vers cadenceur

### E. M221 Gestion Poudres

- Gestion du dosage des poudres pour tous les malaxeurs
- Contrôle des trémies de poudres
- Remontée données vers cadenceur

---

# 3. AUTOMATISME ET COMMUNICATION

## 3.1 Automates et Protocoles

### Automates Schneider M221 (existants)

- 3 automates pour contrôle malaxeurs (B12, B35, B67)
- 1 automate pour gestion liquides
- 1 automate pour gestion poudres
- Communication : Modbus TCP avec cadenceur S7-1513

### Automate Siemens S7-1513 (nouveau)

- Cadenceur central
- Communication OPC UA avec supervision
- Communication Modbus TCP avec M221
- Coordination globale

## 3.2 Communication OPC UA

### Variables d'échange Supervision ↔ S7-1513

#### Commandes (Write - Supervision → Automate)

- Sélection recette par malaxeur
- Démarrage/Arrêt production
- Commandes manuelles (bras, vis, etc.)
- Paramètres de recette
- Acquittement alarmes

#### États (Read - Automate → Supervision)

- État malaxeurs (Arrêt/Marche/Erreur)
- État moteurs (Bras GV, Vis PV/GV)
- Température cuve
- Pression
- Vitesse rotation
- Puissance consommée
- Étape en cours
- Progression recette
- Poids dosés par étape
- Alarmes et défauts

## 3.3 Communication Modbus TCP

### Variables d'échange S7-1513 ↔ M221

- Distribution recettes aux M221
- Commandes de démarrage/arrêt
- Synchronisation dosages
- Remontée états et mesures
- Gestion priorités

## 3.4 Variables d'Échange

### Par Malaxeur (B1 à B7)

- État général (Arrêt/Marche/Erreur/Maintenance)
- Moteur Bras (GV) : État, Vitesse, Puissance
- Moteur Vis (PV/GV) : État, Vitesse, Puissance
- Température cuve (°C)
- Pression (bar)
- Recette en cours
- Étape actuelle
- Progression étape (%)
- Poids dosés par étape (Kg)
- Poids à doser restant (Kg)
- Durée étape (s)
- Temps écoulé (s)

### Système Liquides

- Niveau D10 (L)
- Niveau D200 (L)
- Niveau Huile (L)
- Débit dosage (L/min)
- État pompes

### Système Poudres

- Niveau trémies (Kg)
- Débit dosage (Kg/min)
- État vis sans fin

---

# 4. BASE DE DONNÉES

## 4.1 Structure de la Base

### Tables Principales

#### Table `recipes` (Recettes)

```sql
- id (UUID, PK)
- name (VARCHAR) - Nom de la recette
- description (TEXT) - Description
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- created_by (UUID, FK → users)
- is_active (BOOLEAN)
```

#### Table `recipe_steps` (Étapes de Recette)

```sql
- id (UUID, PK)
- recipe_id (UUID, FK → recipes)
- step_number (INTEGER) - Numéro d'étape (1, 2, 3...)
- function (VARCHAR) - Type d'opération :
  * Démarrage
  * Dosage Automatique
  * Introduction Manuelle
  * Mélange
  * Prépa mise au vide
  * Mise au vide
  * Extrusion
- arm (VARCHAR) - Bras : 'GV' ou 'PV'
- screw (VARCHAR) - Vis : 'GV' ou 'PV'
- duration (INTEGER) - Durée en secondes
- product (VARCHAR) - Nom du produit (optionnel)
- weight (DECIMAL) - Poids en Kg (optionnel)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Table `batches` (Lots de Production)

```sql
- id (UUID, PK)
- batch_number (VARCHAR, UNIQUE) - Numéro de lot
- mixer_id (INTEGER) - Malaxeur (1-7)
- recipe_id (UUID, FK → recipes)
- started_at (TIMESTAMP)
- completed_at (TIMESTAMP)
- status (VARCHAR) - 'En cours', 'Terminé', 'Interrompu', 'Erreur'
- operator_id (UUID, FK → users)
- created_at (TIMESTAMP)
```

#### Table `batch_steps` (Étapes Exécutées)

```sql
- id (UUID, PK)
- batch_id (UUID, FK → batches)
- step_number (INTEGER)
- planned_weight (DECIMAL) - Poids prévu (Kg)
- actual_weight (DECIMAL) - Poids réellement dosé (Kg)
- planned_duration (INTEGER) - Durée prévue (s)
- actual_duration (INTEGER) - Durée réelle (s)
- started_at (TIMESTAMP)
- completed_at (TIMESTAMP)
- status (VARCHAR) - 'OK', 'Écart'
- deviation_percent (DECIMAL) - Écart en %
```

#### Table `inventory` (Stocks)

```sql
- id (UUID, PK)
- product_name (VARCHAR, UNIQUE) - Nom du produit
- current_quantity (DECIMAL) - Quantité actuelle
- max_capacity (DECIMAL) - Capacité maximale
- min_threshold (DECIMAL) - Seuil minimal d'alerte
- unit (VARCHAR) - Unité : 'Kg', 'L'
- category (VARCHAR) - Catégorie : 'Composant', 'Polymère', 'Additif', 'Catalyseur', etc.
- status (VARCHAR) - 'Normal', 'Bas', 'Critique'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Table `inventory_transactions` (Transactions de Stock)

```sql
- id (UUID, PK)
- inventory_id (UUID, FK → inventory)
- batch_id (UUID, FK → batches, nullable)
- transaction_type (VARCHAR) - 'Consumption', 'Replenishment'
- quantity (DECIMAL) - Quantité
- previous_quantity (DECIMAL)
- new_quantity (DECIMAL)
- operator_id (UUID, FK → users)
- created_at (TIMESTAMP)
```

#### Table `alarms` (Alarmes)

```sql
- id (UUID, PK)
- mixer_id (INTEGER) - Malaxeur concerné
- alarm_code (VARCHAR) - Code alarme
- description (TEXT)
- level (VARCHAR) - 'Info', 'Warning', 'Critique'
- status (VARCHAR) - 'Active', 'Acquittée'
- occurred_at (TIMESTAMP)
- acknowledged_at (TIMESTAMP, nullable)
- acknowledged_by (UUID, FK → users, nullable)
```

#### Table `users` (Utilisateurs)

```sql
- id (UUID, PK)
- username (VARCHAR, UNIQUE)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- role (VARCHAR) - 'Admin', 'Operator', 'Viewer'
- created_at (TIMESTAMP)
- last_login (TIMESTAMP, nullable)
```

#### Table `batch_metrics` (Métriques de Production)

```sql
- id (UUID, PK)
- batch_id (UUID, FK → batches)
- timestamp (TIMESTAMP)
- temperature (DECIMAL) - Température cuve (°C)
- speed (DECIMAL) - Vitesse (tr/min)
- power (DECIMAL) - Puissance (kW)
- pressure (DECIMAL) - Pression (bar)
```

## 4.2 Relations

- `recipes` → `recipe_steps` (1-N)
- `recipes` → `batches` (1-N)
- `batches` → `batch_steps` (1-N)
- `batches` → `batch_metrics` (1-N)
- `batches` → `inventory_transactions` (1-N)
- `inventory` → `inventory_transactions` (1-N)
- `users` → `batches` (1-N) - Opérateur
- `users` → `alarms` (1-N) - Acquittement

## 4.3 Gestion de l'Historique

- Conservation complète de tous les lots produits
- Historique des étapes avec écarts consigne/mesure
- Métriques temporelles (température, vitesse, puissance)
- Traçabilité complète des consommations
- Logs système et événements

---

# 5. GESTION DES RECETTES

## 5.1 Structure des Recettes

Chaque recette est composée d'une série d'étapes séquentielles. Une recette standard contient **32 étapes** avec les types suivants :

### Types d'Étapes

1. **Démarrage** : Initialisation du malaxeur
2. **Dosage Automatique** : Dosage automatique de produits
3. **Introduction Manuelle** : Introduction manuelle de produits
4. **Mélange** : Phase de mélange
5. **Prépa mise au vide** : Préparation à la mise sous vide
6. **Mise au vide** : Mise sous vide
7. **Extrusion** : Phase d'extrusion

### Paramètres par Étape

- **Numéro d'étape** : Ordre séquentiel (1, 2, 3...)
- **Fonction** : Type d'opération
- **Bras** : Configuration 'GV' ou 'PV'
- **Vis** : Configuration 'GV' ou 'PV'
- **Durée** : Temps en secondes
- **Produit** : Nom du produit (optionnel)
- **Poids** : Quantité en Kg (optionnel)

## 5.2 Fonctionnalités de Gestion

### CRUD Complet

- ✅ **Création** : Créer une nouvelle recette avec toutes ses étapes
- ✅ **Lecture** : Consulter les recettes et leurs étapes
- ✅ **Modification** : Modifier une recette existante étape par étape
- ✅ **Suppression** : Supprimer une recette (avec confirmation)

### Édition des Étapes

- ✅ **Ajout d'étapes** : Bouton "Ajouter une étape" avec valeurs par défaut
- ✅ **Modification** : Tous les champs sont éditables :
  - Fonction (liste déroulante)
  - Bras (sélecteur GV/PV)
  - Vis (sélecteur GV/PV)
  - Durée (champ numérique en secondes)
  - Produit (champ texte optionnel)
  - Poids (champ numérique optionnel en Kg)
- ✅ **Suppression** : Bouton X pour supprimer une étape (numérotation auto)
- ✅ **Réorganisation** : Possibilité de réordonner les étapes

### Interface d'Édition

- Tableau complet avec toutes les colonnes
- Format pleine largeur pour meilleure lisibilité
- En-têtes de colonnes fixes lors du défilement
- ScrollArea pour naviguer dans les étapes
- Dialogue agrandi (max-w-7xl, max-h-[95vh])

## 5.3 API de Gestion

### Endpoints REST

```
GET    /api/recipes              - Liste toutes les recettes
GET    /api/recipes/:id          - Détails d'une recette avec étapes
POST   /api/recipes              - Créer une nouvelle recette
PUT    /api/recipes/:id          - Modifier une recette
DELETE /api/recipes/:id          - Supprimer une recette
GET    /api/recipes/:id/steps    - Liste des étapes d'une recette
POST   /api/recipes/:id/steps    - Ajouter une étape
PUT    /api/recipes/:id/steps/:stepId - Modifier une étape
DELETE /api/recipes/:id/steps/:stepId - Supprimer une étape
```

## 5.4 Migration des Données

- Import des recettes existantes depuis l'ancien système
- Validation de la structure des données
- Conversion des formats si nécessaire
- Vérification de l'intégrité des données

---

# 6. INTERFACE DE SUPERVISION

## 6.1 Vue d'Ensemble Multi-Malaxeurs

### Page Principale (Dashboard)

Affichage de tous les 6 malaxeurs en vue d'ensemble avec :

#### Cartes Malaxeurs

Pour chaque malaxeur (B1 à B7) :

- **Image du malaxeur** : Photo industrielle avec indicateurs visuels
- **Indicateurs de moteurs** avec code couleur :
  - 🟢 **Vert** (avec pulsation) : Moteur en marche
  - ⚪ **Gris** : Moteur à l'arrêt
  - 🔴 **Rouge** : Défaut
  - 🟠 **Orange** : Maintenance
- **Deux indicateurs séparés** :
  - Moteur Bras (GV)
  - Moteur Vis (PV/GV)
- **Badge de statut** : État du malaxeur
- **Overlays colorés** : Teinte selon le statut
- **Informations principales** :
  - Statut (Arrêt/Marche/Erreur)
  - Recette en cours
  - Étape actuelle
  - Température
  - Progression globale

#### Statistiques Globales

- Total des produits en stock
- Nombre de niveaux critiques
- Nombre de niveaux bas
- Consommation totale cumulée
- Malaxeurs en production
- Alarmes actives

## 6.2 Page de Sélection des Recettes

### Fonctionnalités

- Liste de toutes les recettes disponibles
- Filtres :
  - Par nom
  - Par statut (Active/Inactive)
- Actions :
  - Créer nouvelle recette
  - Modifier recette existante
  - Supprimer recette
  - Voir détails
- Affichage :
  - Nom de la recette
  - Nombre d'étapes
  - Date de création
  - Dernière modification
  - Statut

## 6.3 Page de Production (Détail Malaxeur)

### Onglets

#### Onglet "Vue d'ensemble"

- Image du malaxeur (taille medium)
- Indicateurs moteurs en temps réel
- Informations principales :
  - Statut
  - Recette en cours
  - Étape actuelle
  - Température, Pression, Vitesse, Puissance
- Graphiques temps réel :
  - Température
  - Vitesse
  - Puissance

#### Onglet "Recette actuelle"

- **Composant RecipeProgress** avec :

##### Vue d'ensemble de la progression

- Barre de progression globale de la recette
- Nombre d'étapes complétées / total
- Total de poids à doser vs dosé vs restant

##### Tableau détaillé des étapes

Pour chaque étape :

- **Statut visuel** : Icône et badge
  - ✅ Terminée (vert)
  - 🔵 En cours (bleu pulsant)
  - ⚪ En attente (gris)
- **Fonction** : Type d'opération
- **Bras et Vis** : Configuration GV/PV
- **Durée** : Temps de l'étape
- **Produit** : Nom de la matière
- **À doser (Kg)** : Poids total à doser pour l'étape
- **Dosé (Kg)** : Poids déjà dosé
  - 100% si terminée
  - Progression % si en cours
- **Barre de progression** : Visuelle du dosage par étape

##### Code couleur

- Fond vert pour les étapes terminées
- Fond bleu pour l'étape en cours
- Fond blanc pour les étapes en attente

#### Onglet "Historique"

- Liste des 10 derniers lots avec :
  - Numéro de lot
  - Recette exécutée
  - Date et heure
  - Statut (Succès/Alerte/Erreur)
  - Badge coloré (vert/orange/rouge)
- Bouton "Voir détails" pour chaque lot

##### Dialogue BatchHistoryDialog

Affichage détaillé d'un lot :

###### En-tête du lot

- Numéro du lot
- Nom de la recette exécutée
- Date et heure de début
- Badge de statut (Succès/Alerte/Erreur)

###### Résumé des performances

- Température moyenne et maximale atteintes
- Vitesse moyenne
- Puissance moyenne
- Durée réelle vs durée prévue

###### Onglet "Étapes exécutées"

Tableau détaillé avec :

- Toutes les étapes de la recette
- Pour chaque étape :
  - Poids prévu
  - Poids réellement dosé
  - Écart en %
  - Durée prévue vs durée réelle
  - Badge de statut (OK ou Écart) selon la précision
- Résumé global des dosages en bas

###### Onglet "Graphiques"

Courbes historiques :

- Température réelle vs cible au cours du temps
- Vitesse réelle vs cible
- Puissance consommée

###### Format

- Fenêtre agrandie (max-w-7xl, max-h-[95vh])
- Défilement automatique si nécessaire

## 6.4 Page de Configuration

### Paramètres Généraux

- Configuration des seuils d'alarme
- Paramètres de communication
- Configuration des utilisateurs et droits
- Paramètres de dosage par produit
- Seuils d'alarme

### Gestion des Recettes

- Import/Export recettes
- Création nouvelle recette
- Modification recettes existantes

## 6.5 Page des Alarmes

Page centralisée pour consulter toutes les alarmes du système.

### Fonctionnalités

#### Filtres

- Filtrer par malaxeur
- Filtrer par niveau (Info/Warning/Critique)
- Filtrer par statut (Active/Acquittée)
- Filtrer par période

#### Affichage

Pour chaque alarme :

- Date et heure
- Malaxeur concerné
- Niveau d'alarme
- Code alarme
- Description
- Statut (Active/Acquittée)
- Opérateur ayant acquitté

#### Actions

- Acquitter une alarme
- Acquitter toutes les alarmes
- Export en CSV/PDF

## 6.6 Page d'Historique

Page permettant de consulter l'historique complet des cycles de production pour assurer la traçabilité.

### Fonctionnalités

#### Filtres de recherche

- Période (date début - date fin)
- Malaxeur
- Recette utilisée
- Statut (Terminé/Interrompu/Erreur)
- Opérateur

#### Liste des cycles

Avec :

- Date et heure
- Malaxeur
- Recette
- Durée totale
- Statut
- Opérateur

#### Vue détaillée d'un cycle

- Informations générales
- Liste des étapes exécutées
- Pour chaque étape :
  - Durée réelle vs prévue
  - Dosages : consigne vs mesure
  - Statut (OK/Hors tolérance)
- Graphiques :
  - Évolution temporelle
  - Comparaison consignes/mesures
  - Alarmes survenues pendant le cycle

#### Export

- Export liste cycles en CSV/Excel

---

# 7. FONCTIONNALITÉS AVANCÉES

## 7.1 Mode Manuel

### Page Mode Manuel (ManualModePage)

Fonctionnalité permettant à l'utilisateur de lancer chaque étape d'une recette manuellement.

#### Sélection de recette

- Menu déroulant pour choisir parmi les recettes disponibles
- Affichage de toutes les étapes détaillées de la recette sélectionnée

#### Tableau complet des étapes

Affichage pour chaque étape :

- Numéro de l'étape
- Statut (En attente / En cours / En pause / Terminée)
- Fonction (Démarrage, Dosage, Mélange, etc.)
- Bras et Vis (GV/PV)
- Temps avec compteur en temps réel
- Produit et poids

#### Contrôles manuels pour chaque étape

- **Lancer** : Démarre l'étape
  - Désactivé si l'étape précédente n'est pas terminée
- **Pause** : Met en pause l'étape en cours
- **Reprendre** : Reprend une étape en pause
- **Passer** : Termine immédiatement l'étape

#### Indicateurs visuels

- Icônes colorées selon le statut :
  - Cercle gris : En attente
  - Horloge bleue pulsante : En cours
  - Pause orange : En pause
  - Check vert : Terminée
- Barres de progression pour les étapes en cours
- Surlignage des lignes :
  - Bleu pour en cours
  - Vert pour terminé
- Barre de progression globale de la recette

#### Timer automatique

- Compte à rebours pour chaque étape
- S'arrête automatiquement à la fin de la durée définie

#### Restrictions de sécurité

- Seuls les administrateurs peuvent lancer/contrôler les étapes
- Obligation de terminer les étapes dans l'ordre séquentiel
- Une seule étape peut être en cours à la fois

#### Intégration avec stocks

- Déduction automatique des quantités lors de la complétion d'une étape
- Notification du stock consommé dans le toast
- Alerte immédiate si le niveau devient critique

## 7.2 Gestion des Stocks

### Page Gestion des Stocks (InventoryPage)

Système complet de gestion des stocks avec suivi automatique des consommations.

#### 26 produits en stock

Correspondant à toutes les matières utilisées dans les recettes :

- Composants
- Polymères
- Additifs
- Catalyseurs
- Liquides (D10, D200, Huile)
- Poudres

#### Suivi détaillé pour chaque produit

- Quantité actuelle dans la cuve
- Capacité maximale
- Seuil minimal d'alerte
- Historique de consommation
- Unité (Kg ou L)
- Catégorie

#### Indicateurs de statut visuels

- 🔴 **Critique** (rouge) : Niveau en dessous du seuil minimal
- 🟠 **Bas** (orange) : Moins de 25% de capacité
- 🟢 **Normal** (vert) : Stock suffisant

#### Alertes automatiques

- Notifications toast quand un produit atteint le niveau critique
- Icône d'alerte pulsante sur les cartes critiques
- Compteurs des niveaux critiques et bas dans le dashboard

#### Réapprovisionnement

- Dialog pour ajouter du stock (réservé aux admins)
- Calcul automatique du nouveau niveau
- Limitation à la capacité maximale
- Traçabilité des transactions

#### Intégration avec le Mode Manuel

- Déduction automatique des quantités lors de la complétion d'une étape
- Notification du stock consommé dans le toast
- Alerte immédiate si le niveau devient critique
- Persistance des données dans la base de données

#### Statistiques du dashboard

- Total des produits en stock
- Nombre de niveaux critiques
- Nombre de niveaux bas
- Consommation totale cumulée

## 7.3 Suivi des Étapes de Recette

### Composant RecipeProgress

Affichage détaillé des étapes en cours avec les poids dosés et à doser.

#### Vue d'ensemble de la progression

- Barre de progression globale de la recette
- Nombre d'étapes complétées / total
- Total de poids à doser vs dosé vs restant

#### Tableau détaillé des étapes

Pour chaque étape :

- Statut visuel (icône et badge)
- Fonction (type d'opération)
- Bras et Vis (configuration GV/PV)
- Durée (temps de l'étape)
- Produit (nom de la matière)
- À doser (Kg) : poids total à doser pour l'étape
- Dosé (Kg) : poids déjà dosé
  - 100% si terminée
  - Progression % si en cours
- Barre de progression visuelle du dosage par étape

#### Données simulées réalistes

- Chaque malaxeur (1 à 6) a une recette différente (A, B ou C)
- Chaque malaxeur est à une étape différente de sa recette
- Le dosage en cours est calculé selon la progression du lot (batchProgress)

## 7.4 Historique des Recettes

### Composant BatchHistoryDialog

Système complet de consultation de l'historique des recettes effectuées.

#### En-tête du lot

- Numéro du lot
- Nom de la recette exécutée
- Date et heure de début
- Badge de statut (Succès/Alerte/Erreur)

#### Résumé des performances

- Température moyenne et maximale atteintes
- Vitesse moyenne
- Puissance moyenne
- Durée réelle vs durée prévue

#### Onglet "Étapes exécutées"

Tableau détaillé avec :

- Toutes les étapes de la recette
- Pour chaque étape :
  - Poids prévu
  - Poids réellement dosé
  - Écart en %
  - Durée prévue vs durée réelle
  - Badge de statut (OK ou Écart) selon la précision
- Résumé global des dosages en bas

#### Onglet "Graphiques"

Courbes historiques :

- Température réelle vs cible au cours du temps
- Vitesse réelle vs cible
- Puissance consommée

#### Format

- Fenêtre agrandie (max-w-7xl, max-h-[95vh])
- Défilement automatique si nécessaire
- Données générées de façon réaliste avec de légères variations pour simuler les écarts de production réels

---

# 8. MÉTHODOLOGIE ET PLANNING

## 8.1 Approche de Développement

Le projet adopte une approche innovante de développement en environnement contrôlé avant déploiement sur site, minimisant ainsi les risques et l'impact sur la production.

### Principe

L'ensemble du système (supervision, automates, communication) est développé et testé en local sur une "mini-usine" reproduisant l'environnement de production réel. Cette approche permet de valider complètement le système avant son installation sur site.

### Mini-usine de développement

#### PC de développement

- PostgreSQL (base de données)
- Node-RED (backend + API)
- React (interface web)
- Serveur OPC UA

#### Automates de test

- Siemens S7-1513 (cadenceur)
- Schneider M221 (1 automate pour tests)
- Configuration identique au site

#### Connexions

- Communication OPC UA Supervision ↔ S7-1513
- Communication Modbus TCP S7-1513 ↔ M221

### Avantages de cette approche

- Tests exhaustifs sans perturber la production
- Validation complète avant déploiement
- Détection et correction des bugs en amont
- Déploiement sur site ultra-rapide (2-3 jours)
- Réduction des risques techniques
- Possibilité de démonstration au client avant installation
- Système 100% fonctionnel dès l'installation

## 8.2 Planning Détaillé

Durée totale estimée : **8-10 semaines** (40-50 jours ouvrés) en développement local + **2-3 jours** d'installation sur site.

### Phase 1 : Infrastructure et Base de Données (4-5 jours)

- Installation PostgreSQL et configuration
- Conception et création du schéma de données
  - Tables recettes et étapes
  - Tables lots et historique
  - Tables stocks et transactions
  - Tables alarmes et utilisateurs
- Migration des recettes existantes
- Installation et configuration Node-RED
- Configuration environnement de développement

### Phase 2 : Backend et API REST (8-10 jours)

- Développement API CRUD recettes
- Développement API gestion stocks
- Développement API historique lots
- Tests API avec Postman
- Optimisation performances base de données
- Sécurisation API (authentification, rôles)
- Documentation API

### Phase 3 : Interface HMI (12-15 jours)

- Maquettage et validation design
- Développement interface - Vue d'ensemble multi-malaxeurs
- Développement interface - Sélection recettes
- Développement interface - Vue production avec onglets
- Développement interface - Configuration
- Développement interface - Alarmes
- Développement interface - Historique
- **Développement Mode Manuel**
- **Développement Gestion Stocks**
- **Développement Suivi Étapes**
- **Développement Historique Détaillé**
- Tests interface et optimisation UX

### Phase 4 : Intégration OPC UA (10-12 jours)

- Analyse architecture OPC UA automate
- Configuration nœuds OPC UA dans Node-RED
- Développement écriture commandes (Write)
- Développement lecture états (Read)
- Synchronisation recette avec automate
- Gestion alarmes et événements
- Tests intégration complète

### Phase 5 : Tests et Validation (5-6 jours)

- Tests fonctionnels complets
  - Gestion recettes
  - Mode manuel
  - Gestion stocks
  - Suivi étapes
  - Historique
- Tests de performance et charge
- Tests de sécurité
- Corrections bugs et optimisations
- Documentation utilisateur

### Phase 6 : Déploiement sur Site (2-3 jours)

#### Jour 1 : Installation matériel et configuration réseau

- Installation serveur
- Configuration réseau
- Connexion aux 6 malaxeurs
- Tests de communication

#### Jour 2 : Migration et tests

- Migration base de données
- Configuration OPC UA définitive
- Tests sur site avec production
- Validation client

#### Jour 3 : Formation et mise en production

- Formation utilisateurs (4-5h)
  - Interface générale
  - Gestion recettes
  - Mode manuel
  - Gestion stocks
  - Consultation historique
- Ajustements finaux
- Mise en production
- Supervision démarrage

## 8.3 Points de Validation

Des points de validation sont prévus à chaque étape clé du projet pour assurer la conformité et la qualité des livrables.

### Jalons de validation

- **Fin Phase 1** : Validation schéma base de données et infrastructure
- **Fin Phase 2** : Validation API et modèle de données
- **Milieu Phase 3** : Validation maquettes interface
- **Fin Phase 3** : Validation interface complète
- **Fin Phase 4** : Validation intégration automate
- **Fin Phase 5** : Recette finale et validation globale
- **Fin Phase 6** : Validation site et mise en production

### Démonstration possible

Avant le déploiement sur site, une démonstration complète du système fonctionnant sur la mini-usine peut être organisée. Cela permet de :

- Valider le système avant installation
- Former les utilisateurs en amont
- Effectuer les ajustements demandés
- Garantir la satisfaction client
- Minimiser les surprises lors du déploiement

---

# CONCLUSION

Ce cahier des charges définit les spécifications complètes du système de supervision multi-malaxeurs, couvrant tous les aspects techniques et fonctionnels du projet, incluant les fonctionnalités avancées développées dans l'interface Figma.

## Points clés du projet

- ✅ Architecture moderne et évolutive (React, Node-RED, PostgreSQL)
- ✅ Communication industrielle standard (OPC UA, Modbus TCP)
- ✅ Base de données centralisée avec traçabilité complète
- ✅ Interface intuitive adaptée aux besoins opérationnels
- ✅ Gestion complète des recettes de production (32 étapes)
- ✅ **Mode manuel** pour contrôle étape par étape
- ✅ **Gestion des stocks** avec alertes automatiques
- ✅ **Suivi détaillé** des étapes avec poids dosés/à doser
- ✅ **Historique complet** avec graphiques et analyses
- ✅ Approche de développement sécurisée (mini-usine)
- ✅ Déploiement rapide et non perturbant (2-3 jours)
- ✅ Autonomie et indépendance technologique

## Fonctionnalités principales

1. **Vue d'ensemble multi-malaxeurs** avec indicateurs visuels en temps réel
2. **Gestion complète des recettes** avec édition étape par étape
3. **Mode manuel** pour contrôle séquentiel des étapes
4. **Gestion des stocks** avec 26 produits et alertes automatiques
5. **Suivi détaillé** des étapes avec progression et poids
6. **Historique complet** avec graphiques et analyses de performance
7. **Page des alarmes** centralisée avec filtres
8. **Interface moderne** avec images industrielles et indicateurs colorés

La méthodologie proposée, basée sur un développement complet en environnement contrôlé, garantit un système fiable et validé avant son installation sur site, minimisant ainsi les risques et l'impact sur la production.

L'approche modulaire et l'utilisation de technologies standards assurent la pérennité du système et facilitent les évolutions futures, répondant ainsi aux problématiques de l'ancien système.

---

**Document Version** : 2.0  
**Date** : Janvier 2026  
**Statut** : Approuvé pour développement

