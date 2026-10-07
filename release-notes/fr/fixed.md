# Corrections

Problèmes corrigés. Format et règles : [VERSIONS.md](../../VERSIONS.md).

## 0.20.1 — 2026-10-07

- Le minuteur des idées affiche le même temps restant sur tous les téléphones, même sur un téléphone dont l'horloge a quelques minutes d'écart.
- Un téléphone qui sort de veille, revient d'une autre appli ou retrouve sa connexion rattrape tout de suite ce qu'on a fait entre-temps, sans attendre ta prochaine action.

## 0.19.1 — 2026-10-07

- Après un tour de départage, le récap des tours d'avant, les exports et le récap partagé montrent toujours les idées retenues à ce moment-là, au lieu de marquer comme écartées celles qui étaient retenues sans être en tête.

## 0.12.1 — 2026-10-06

- L'export Markdown montre les prénoms, les sujets et les idées tels qu'ils ont été tapés : des caractères comme * ou [ ne se transforment plus en mise en forme ou en liens, et le nom du fichier porte le même jour que la date indiquée dedans.
- Quand deux personnes agissent au même instant, la séance ne peut plus se retrouver avec deux personnes qui animent, plus de monde que de places, deux fois la même idée ou deux fois le même prénom ; et un souci du serveur au moment de rejoindre ne dit plus que ton prénom est déjà pris.

## 0.11.3 — 2026-10-06

- Sur une tablette tenue à la verticale, un tableau choisi plus tôt laisse place à la liste, faute de bouton pour y revenir.
- Copier le lien d'invitation le dit quand le navigateur refuse, au lieu de ne rien faire.
- Les petits boutons (retirer une option de liste, le lien vers la carte, fermer une fenêtre) se touchent maintenant facilement, et déplacer un sujet garde le focus du clavier.
- Les animations oubliées respectent maintenant le réglage « réduire les animations » ; le bilan accorde au pluriel le nombre d'idées retenues.

## 0.11.2 — 2026-10-06

- Dans un sujet qui limite les votes « pour », appuyer très vite sur plusieurs idées ne permet plus de dépasser la limite.
- Une fois le bilan vu, plus personne ne peut partir ni être retiré, même si les votes sont rouverts : les résultats déjà vus restent tels quels.
- Un sujet des tours précédents ne peut plus être supprimé en revenant aux sujets, ce qui l'effaçait des bilans déjà vus et des exports.
- Baisser la limite de votes d'un sujet, ou désactiver le vote sur ses propres idées, s'applique maintenant aux votes déjà donnés ; lancer les idées deux fois par erreur n'affiche plus deux fois les options d'une liste.

## 0.6.15 — 2026-10-05

- Un mot long dans un sujet, comme un lien collé, ne pousse plus la page sur le côté, sur téléphone comme sur ordinateur : il passe à la ligne.

## 0.6.14 — 2026-10-05

- Revenir en arrière dans ton navigateur n'affiche plus une étape terminée (jusqu'à 30 secondes avec les mises à jour en temps réel) : l'étape en cours revient aussitôt, et revenir en arrière quitte la séance au lieu de tourner en rond.

## 0.6.13 — 2026-10-02

- Quand le serveur est surchargé, la séance ne laisse plus place à une page d'erreur brute : elle reste à l'écran, un vote qui n'a pas pu être enregistré te le dit, et tout se met à jour dès que le serveur répond de nouveau.

## 0.6.12 — 2026-10-02

- Sur une connexion lente, la séance restait figée, même sur l'idée que tu venais d'ajouter : elle se met maintenant à jour, une modification après l'autre.

## 0.6.11 — 2026-10-02

- Un vote, une idée ou une nouvelle séance perdus pendant que ton téléphone change de réseau ne remplacent plus l'étape par une page d'erreur : un message te propose de réessayer, et ce que tu as saisi reste.

## 0.6.10 — 2026-10-02

- Après une coupure de la connexion en temps réel, la séance se met à jour dès la reconnexion, au lieu de jusqu'à 30 secondes plus tard.

## 0.6.9 — 2026-10-02

- Quand ton téléphone sort de veille avant son réseau, la séance ne laisse plus place à la page d'erreur du navigateur : elle attend la connexion, puis se met à jour.

## 0.6.8 — 2026-10-02

- Une page coupée par le réseau pendant son chargement, restée sans mise en forme ni boutons qui marchent, se recharge maintenant d'elle-même dès que tu es de nouveau en ligne.

## 0.6.7 — 2026-10-02

- Une coupure de réseau ne remplace plus la séance par la page hors ligne du navigateur : elle reste à l'écran, te prévient quand un vote ou une idée n'a pas pu partir, et se met à jour dès que tu es de nouveau en ligne.

## 0.6.5 — 2026-10-01

- Les lecteurs d'écran annoncent maintenant le titre de chaque page et les places de l'écran pour rejoindre, et les boutons rouges gardent assez de contraste, y compris en mode sombre.

## 0.6.3 — 2026-10-01

- Dans l'export en anglais, plus d'espace avant les deux-points : c'est un usage propre au français.

## 0.5.5 — 2026-10-01

- Une fois arrivé au premier récap, la personne qui anime ne peut plus retirer quelqu'un : les résultats restent ceux du vote.

## 0.5.4 — 2026-09-30

- Le bouton Ajouter est de nouveau aligné avec le champ du lieu.

## 0.3.0 — 2026-09-30

- Votes et pointillés lisibles en mode sombre.
