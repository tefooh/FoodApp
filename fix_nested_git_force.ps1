$root = Get-Location
Get-ChildItem -Path . -Recurse -Directory -Filter ".git" -Force | ForEach-Object {
    if ($_.FullName -ne "$root\.git") {
        Write-Host "Removing nested git repo: $($_.FullName)"
        Remove-Item -Path $_.FullName -Recurse -Force
    }
}

git rm -r --cached .
git add .
git status
git commit -m "Fix: Remove nested git repositories and re-add all source code"
git push origin main
