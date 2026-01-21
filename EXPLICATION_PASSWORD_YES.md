# 🔍 Explication : "using password: YES"

## Qu'est-ce que ça signifie ?

Quand MySQL affiche :
```
ERROR 1045 (28000): Access denied for user 'root'@'localhost' (using password: YES)
```

Cela signifie :
- ✅ MySQL **a reçu** un mot de passe
- ❌ Mais ce mot de passe est **incorrect**

## Différence avec "using password: NO"

| Message | Signification |
|---------|---------------|
| `(using password: YES)` | MySQL a reçu un mot de passe, mais il est **incorrect** |
| `(using password: NO)` | Aucun mot de passe n'a été fourni, mais MySQL en **attend un** |

## Pourquoi ça arrive ?

MySQL stocke le mot de passe de l'utilisateur `root` dans sa base de données. Si vous essayez de vous connecter avec un mot de passe qui ne correspond pas, vous verrez cette erreur.

## Solutions

### 1. Tester différents mots de passe

```bash
# Essayer sans mot de passe
mysql -u root

# Essayer avec le mot de passe
mysql -u root -p
# (Il vous demandera le mot de passe)

# Essayer avec un mot de passe spécifique
mysql -u root -pmysql123
```

### 2. Réinitialiser le mot de passe

Si vous ne connaissez pas le mot de passe, vous devez le réinitialiser :

```bash
# Arrêter MySQL
brew services stop mysql

# Démarrer en mode sûr
sudo mysqld_safe --skip-grant-tables &

# Se connecter (sans mot de passe nécessaire)
mysql -u root

# Dans MySQL, réinitialiser :
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'mysql123';
FLUSH PRIVILEGES;
EXIT;

# Redémarrer MySQL normalement
sudo killall mysqld_safe
brew services start mysql
```

### 3. Vérifier les utilisateurs MySQL

Une fois connecté (si vous y arrivez), vous pouvez voir tous les utilisateurs :

```sql
USE mysql;
SELECT user, host FROM user;
```

## Pour votre cas

Le message `(using password: YES)` avec `mysql123` signifie que :
- Le mot de passe `mysql123` n'est **pas** le mot de passe actuel de votre utilisateur `root`
- Vous devez soit trouver le bon mot de passe, soit le réinitialiser

**Action recommandée** : Réinitialiser le mot de passe à `mysql123` pour que tout corresponde.
