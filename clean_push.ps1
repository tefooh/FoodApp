git config core.autocrlf true
git rm -r --cached .
git add .
git commit -m "Fix: Add proper .gitignore and track all files"
git push origin main
