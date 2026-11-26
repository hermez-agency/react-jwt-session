---
"react-jwt-session": minor
---

`UserProvider` suit désormais la session des autres onglets via l'événement `storage` : une déconnexion y remet `user` à `undefined`, une connexion recharge l'utilisateur.
