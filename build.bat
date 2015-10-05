echo do git stuff for main bine folder (push to github)
git add -A
git commit -m "batch commit for main bine repository"
git push
echo go to the end client (github.io) folder and remove all files
cd ../kramff.github.io/
del /Q *
echo go back to the source client folder and copy the new files over
cd ../Bine/Client
copy * ../../kramff.github.io/
echo go to the end clinet folder and do git stuff (push to github)
cd ../../kramff.github.io/
git add -A
git commit -m "batch commit for kramff.github.io" 
git push
echo go to server folder and remove app.js
cd ../bine-online/
del /Q server.js
echo go to source server folder and copy new app.js over
cd ../Bine/Server/
copy app.js ../../bine-online/
echo go to server folder and do git stuff (push to heroku)
git add -A
git commit -m "batch commit for bine-online"
git push heroku master