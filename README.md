# Visualiseur TSP

## Aperçu
Ce projet est un visualiseur web pour résoudre le problème du voyageur de commerce (TSP) en utilisant divers algorithmes heuristiques. Le visualiseur vous permet de générer des villes aléatoires, de sélectionner un algorithme et d'observer en temps réel la progression de l'algorithme pour trouver le chemin le plus court qui visite chaque ville exactement une fois et revient à la ville d'origine.

## Fonctionnalités
- **Algorithmes Supportés** :
  - Algorithme Génétique (GA)
  - Recuit Simulé (SA)
  - Recherche Tabou (TS)
  - Optimisation par Essaim de Particules (PSO) avec Clés Aléatoires
- **Canvas Interactif** : Visualisez les villes et le meilleur chemin trouvé par l'algorithme.
- **Paramètres Personnalisables** : Ajustez le nombre de villes, les itérations et les paramètres spécifiques à l'algorithme.
- **Mises à Jour en Temps Réel** : Consultez les distances courantes et les meilleures distances, ainsi que le nombre d'itérations effectuées.
- **Exécution Pas à Pas** : Exécutez l'algorithme étape par étape pour observer sa progression.

## Comment Utiliser
1. **Cloner le Répertoire** :
   ```bash
   git clone https://github.com/Burden19/TSP_example
   cd TSP_example
   ```

2. **Ouvrir le Projet** :
   Ouvrez le fichier `index.html` dans votre navigateur web pour lancer le visualiseur.

3. **Générer des Villes** :
   - Cliquez sur le bouton "Générer points" pour générer un ensemble de villes aléatoires sur le canvas.

4. **Sélectionner un Algorithme** :
   - Choisissez un algorithme dans le menu déroulant (GA, SA, TS ou PSO).

5. **Ajuster les Paramètres** :
   - Définissez le nombre de villes, les itérations et les paramètres spécifiques à l'algorithme (si applicable).

6. **Exécuter l'Algorithme** :
   - Cliquez sur le bouton "Démarrer" pour lancer l'algorithme.
   - Utilisez les boutons "Pause" et "Étape" pour contrôler l'exécution.

7. **Réinitialiser** :
   - Cliquez sur le bouton "Réinitialiser" pour effacer le canvas et réinitialiser l'algorithme.

## Scripts Python
Le projet inclut des implémentations Python des algorithmes pour une utilisation hors ligne :
- `genetic_tsp.py` : Algorithme Génétique pour le TSP.
- `simulated_annealing_tsp.py` : Recuit Simulé pour le TSP.
- `tabu_search_tsp.py` : Recherche Tabou pour le TSP.
- `pso_TSP.py` : Optimisation par Essaim de Particules (Clés Aléatoires) pour le TSP.

## Dépendances
- **Web** : Le visualiseur fonctionne entièrement dans le navigateur en utilisant HTML, CSS et JavaScript. Aucune dépendance supplémentaire n'est requise.
- **Python** : Les scripts Python nécessitent Python 3.x et la bibliothèque `numpy`.

## Licence
Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Contribution
Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request pour toute amélioration ou correction de bug.

## Remerciements
- Inspiré par divers algorithmes heuristiques pour résoudre le problème du voyageur de commerce.
- Construit avec JavaScript, HTML et CSS pour la simplicité et la facilité d'utilisation.

## Contact
Pour toute question ou retour, veuillez contacter Ahmed Mbarek à ahmedmbarek61@gmail.com.
