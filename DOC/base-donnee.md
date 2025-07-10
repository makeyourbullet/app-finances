# 📊 Structure de la base de données – App Finances

Ce fichier documente les tables Supabase utilisées dans l'application.

---

## 🧾 Table `comptes`

| Colonne        | Type     | Description                              |
|----------------|----------|------------------------------------------|
| `id`           | uuid     | Identifiant unique                       |
| `nom_compte`   | text     | Nom du compte                            |
| `banque`       | text     | Banque associée                          |
| `type_compte`  | text     | Type de compte (épargne, courant, etc.)  |
| `solde_init`   | numeric  | Solde initial du compte (€)              |
| `created_at`   | timestamp| Date de création                         |
| `updated_at`   | timestamp| Dernière mise à jour                     |

---

## 📁 Table `projets`

| Colonne        | Type     | Description                              |
|----------------|----------|------------------------------------------|
| `id`           | uuid     | Identifiant unique du projet             |
| `nom_projet`   | text     | Nom du projet                            |
| `objectif`     | numeric  | Montant à atteindre                      |
| `mensualite`   | numeric  | Montant à épargner chaque mois           |
| `date_debut`   | date     | Début du projet                          |
| `date_fin`     | date     | Fin du projet                            |
| `compte_id`    | uuid     | Compte lié au projet                     |
| `created_at`   | timestamp| Date de création                         |
| `updated_at`   | timestamp| Dernière mise à jour                     |

---

## 🔁 Table `mouvements_fixes`

| Colonne        | Type     | Description                              |
|----------------|----------|------------------------------------------|
| `id`           | uuid     | Identifiant unique                       |
| `nom`          | text     | Nom du mouvement                         |
| `compte_id`    | uuid     | Compte concerné                          |
| `montant`      | numeric  | Montant mensuel                          |
| `type`         | text     | Type : "revenu" ou "dépense"             |
| `actif`        | bool     | Si le mouvement est actif                |
| `created_at`   | timestamp| Date de création                         |
| `updated_at`   | timestamp| Dernière mise à jour                     |

---

## 📉 Table `mouvements_variables`

| Colonne        | Type     | Description                              |
|----------------|----------|------------------------------------------|
| `id`           | uuid     | Identifiant unique                       |
| `nom`          | text     | Nom du mouvement                         |
| `type`         | text     | Type : "revenu" ou "dépense"             |
| `montant`      | numeric  | Montant de base                          |
| `compte_id`    | uuid     | Compte concerné                          |
| `created_at`   | timestamp| Date de création                         |
| `updated_at`   | timestamp| Dernière mise à jour                     |

---

## 📉 Table `mouvements_variables_mensuels`

| Colonne                   | Type     | Description                              |
|---------------------------|----------|------------------------------------------|
| `id`                      | uuid     | Identifiant unique                       |
| `date`                    | date     | Date du mouvements                       |
| `mouvements_variables_id` | uuid     | Mouvement variable concerné              |
| `montant`                 | numeric  | Montant                                  |
| `created_at`              | timestamp| Date de création                         |
| `updated_at`              | timestamp| Dernière mise à jour                     |

---

## 💰 Table `epargne_projet`

| Colonne         | Type     | Description                              |
|-----------------|----------|------------------------------------------|
| `id`            | uuid     | Identifiant unique                       |
| `created_at`    | timestamp| Date de création                         |
| `updated_at`    | timestamp| Dernière mise à jour                     |
| `montant_cumul` | numeric  | Montant total épargné                    |
| `date`          | date     | Date de l'enregistrement                 |
| `projet_id`     | uuid     | Projet lié                               |

---

## 💸 Table `depenses_projet`

| Colonne        | Type     | Description                              |
|----------------|----------|------------------------------------------|
| `id`           | uuid     | Identifiant unique                       |
| `date`         | date     | Date de la dépense                       |
| `description`  | text     | Description de la dépense                |
| `projet_id`    | uuid     | Projet concerné                          |
| `montant`      | numeric  | Montant dépensé                          |
| `created_at`   | timestamp| Date de création                         |
| `updated_at`   | timestamp| Dernière mise à jour                     |

---
## 💸 Table `depenses_projet_recurrentes`

| Colonne        | Type     | Description                              |
|----------------|----------|------------------------------------------|
| `id`           | uuid     | Identifiant unique                       |
| `date_debut`   | date     | Date de départ de la récurrence          |
| `description`  | text     | Description de la dépense                |
| `frequence`    | text     | Fréquence de la récurrence               |
| `projet_id`    | uuid     | Projet concerné                          |
| `montant`      | numeric  | Montant dépensé                          |
| `created_at`   | timestamp| Date de création                         |
| `updated_at`   | timestamp| Dernière mise à jour                     |

---
## 📊 Table `suivi_budget`

| Colonne        | Type     | Description                              |
|----------------|----------|------------------------------------------|
| `date`         | date     | Mois concerné                            |
| `description`  | text     | Description du suivi                     |
| `montant`      | numeric  | Montant prévu ou réel                    |
| `mouvement_id` | uuid     | Mouvement Variable Associé               |
| `created_at`   | timestamp| Date de création                         |
| `updated_at`   | timestamp| Dernière mise à jour                     |

---

## 🔐 Notes

- Toutes les tables utilisent `uuid` comme identifiant principal (`id`)
- Les relations entre les tables sont gérées par les colonnes `compte_id` et `projet_id`
