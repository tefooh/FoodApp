$root = Get-Location
Get-ChildItem -Path . -Recurse -Directory -Filter ".git" | ForEach-Object {
    if ($_.FullName -ne "$root\.git") {
        Write-Host "Removing nested git repo: $($_.FullName)"
        Remove-Item -Path $_.FullName -Recurse -Force
    }
}

git rm -r --cached .
git add .
git status
git commit -m "Fix: Restoration of source code and removal of nested git repos"
git push origin main
