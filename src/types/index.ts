export type MixerStatus = 'Arrêt' | 'Production' | 'Pause' | 'Alarme';
export type MotorStatus = 'Arrêt' | 'Marche' | 'Défaut' | 'Maintenance';
export type StepStatus = 'En attente' | 'En cours' | 'En pause' | 'Terminée' | 'Reversible';
export type AlarmLevel = 'Info' | 'Warning' | 'Critique';
export type AlarmStatus = 'Active' | 'Acquittée';
export type BatchStatus = 'En cours' | 'Terminé' | 'Interrompu' | 'Erreur' | 'Succès' | 'Alerte';
export type InventoryStatus = 'Normal' | 'Bas' | 'Critique';
export type UserRole = 'Admin' | 'B1/2' | 'B3/5' | 'B6/7' | 'Operator' | 'Viewer';
export type ExecutionStatus = 'EN_COURS' | 'TERMINE' | 'ERREUR' | 'INTERROMPU';
export type RecipeFunction = 
  | 'Démarrage' 
  | 'Dosage Automatique' 
  | 'Introduction Manuelle' 
  | 'Mélange' 
  | 'Prépa mise au vide' 
  | 'Mise au vide' 
  | 'Extrusion';

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  steps: RecipeStep[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface RecipeStep {
  id: string;
  stepNumber: number;
  function: RecipeFunction;
  arm: 'GV' | 'PV';
  screw: 'GV' | 'PV';
  duration: number; // en secondes
  product?: string;
  weight?: number; // en Kg
  vacuum?: number; // vide(%)
  critere?: string; // critère de fin d'étape
  status?: StepStatus; // Statut de l'étape (Reversible, etc.)
}

export interface Mixer {
  id: number; // 1-7
  name: string;
  status: MixerStatus;
  recipe?: Recipe;
  currentStep?: number;
  progress?: number; // 0-100
  temperature: number;
  pressure: number;
  speed: number;
  power: number;
  motorArm: MotorStatus;
  motorScrew: MotorStatus;
  batchProgress?: number; // 0-100 pour le lot en cours
}

export interface Batch {
  id: string;
  batchNumber: string;
  mixerId: number;
  recipeId: string;
  recipeName: string;
  startedAt: string;
  completedAt?: string;
  status: BatchStatus;
  operatorId?: string;
  steps: BatchStep[];
  metrics?: BatchMetric[];
  // Nouveaux champs de production
  formule?: string;
  designation?: string;
  fabricant?: string;
  tempsRestantSec?: number;
  produitConsigne?: number;
  produitMesure?: number;
  prochainAppelOperateurMin?: number;
  appelPreparationVideMin?: number;
  distribution?: BatchDistribution[];
}

export interface BatchDistribution {
  id: number;
  batchId: string;
  productName: string; // 'Hydrocarb', 'Napvis D10', 'Napvis D200', 'Huile HM'
  qteFormule: number; // Quantité formule
  qteDosee: number; // Quantité dosée
  dose: number; // Dose
  createdAt: string;
  updatedAt: string;
}

export interface BatchStep {
  id: string;
  stepNumber: number;
  plannedWeight?: number;
  actualWeight?: number;
  plannedDuration: number;
  actualDuration?: number;
  startedAt?: string;
  completedAt?: string;
  status: 'OK' | 'Écart';
  deviationPercent?: number;
}

export interface BatchMetric {
  timestamp: string;
  temperature: number;
  speed: number;
  power: number;
  pressure: number;
}

export interface Alarm {
  id: string;
  mixerId: number;
  alarmCode: string;
  description: string;
  level: AlarmLevel;
  status: AlarmStatus;
  occurredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface Inventory {
  id: string;
  productName: string;
  currentQuantity: number;
  maxCapacity: number;
  minThreshold: number;
  unit: 'Kg' | 'L';
  category: string;
  status: InventoryStatus;
}

export interface InventoryTransaction {
  id: string;
  inventoryId: string;
  batchId?: string;
  transactionType: 'Consumption' | 'Replenishment';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  operatorId?: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export interface EtapesExecution {
  id: number;
  cycleId: string;
  etapeRecetteId: string;
  numeroEtape: number;
  dateDebut: string;
  dateFin?: string;
  dureeReelleSec?: number;
  quantiteDosee?: number;
  consigneAtteinte: boolean;
  valeurCritere?: string;
  statut: ExecutionStatus;
  commentaire?: string;
}

export interface DefautCatalogue {
  idDefaut: number;
  automate: string;
  codeDefaut: string;
  description: string;
  priorite: number;
  createdAt: string;
  updatedAt: string;
}

