start http-server
start node Server/app.js
set cl=Client/Scripts/bine_
set iso=Isomorphic/bine_
start gvim -p index.html %cl%main.js %cl%menu.js %iso%session.js %cl%render.js
start chrome http://localhost:8080/index.html
start powershell
start .
