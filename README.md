# ⚡️ alyra-project2 - Système de vote 2

## :point_right: Enoncé

Oui oui, nous allons repartir du défi “Système de vote” !

Vous repartirez du smart contract proposé en correction

Depuis la dernière version, vous avez vu la partie CI/CD avec les tests et le déploiement.

Vous devez alors fournir les tests unitaires de votre smart contract Nous n’attendons pas une couverture à 100% du smart contract mais veillez à bien tester les différentes possibilités de retours (event, revert).

## :point_right: Complément d'information

![alt text](./resources/screenshot.png)

## :point_right: Stratégie de test

Le plan de test est simple: passer en revue l'ensemble des méthodes du contract _Voting.sol_. Pour cela nous avons effectué les tâches suivantes:

-   Définit un objet _WorkflowStatus_ pour répliquer l'enum des différents états du workflow qui se trouve dans le contrat _Voting.sol_.
-   Définit nos fixtures pour préparer notre environnement pour nos tests. J'ai pris l'initiative de n'utiliser que des fixtures et aucun appel aux fonctions natives de mocha: _before_ et _beforeEach_. Afin d'améliorer mon code j'ai pris le parti de composer mes fixtures avec des fonctions que je peux réutiliser dans différentes fixtures.
-   Définit nos tests unitaires en passant sur chaque méthode. Chaque méthode correspond à un _describe_ qui contient plusieurs tests propre à cette dernière. Pour chaque méthode et afin de déterminer les tests à réaliser nous avons suivi les étapes suivantes:
    -   Tester le/les modifiers
    -   Tester les différents require
    -   Tester les événements émis
    -   Tester un cas de succès
    -   Eventuels autres tests

## :point_right: Coverage

### Hardhat tests run

![alt text](./resources/coverage.png)

### Hardhat tests gas report (in €)

![alt text](./resources/gas.png)

### Codecov Badge and heating maps

J'ai développé une action Github pour uploader tous les fichiers de coverage resultant des tests hardhats sur Codecov afin de tracker la progression du coverage: [codecov.yml](./.github/workflows/codecov.yml). Cette action m'a également permis d'ajouter des informsions de coverage sur ce README.

Voici le badge Codecov qui indique le pourcentage de coverage du projet:

[![codecov](https://codecov.io/gh/manthis/alyra-project2/graph/badge.svg?token=RCE9F2AA3K)](https://codecov.io/gh/manthis/alyra-project2)

Voici ci-dessous les graphiques générés par Codecov illustrant le coverage du projet:

#### 1. Sunburst

![alt text](https://codecov.io/gh/manthis/alyra-project2/graphs/sunburst.svg?token=RCE9F2AA3K)

#### 2. Grid

![alt text](https://codecov.io/gh/manthis/alyra-project2/graphs/tree.svg?token=RCE9F2AA3K)

#### 3. Icicle

![alt text](https://codecov.io/gh/manthis/alyra-project2/graphs/icicle.svg?token=RCE9F2AA3K)
