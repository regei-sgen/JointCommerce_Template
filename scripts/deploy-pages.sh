#!/usr/bin/env bash
# Builds for GitHub Pages and force-pushes dist/ to the gh-pages branch.
set -euo pipefail
cd "$(dirname "$0")/.."
GH_PAGES=1 npm run build
cp dist/index.html dist/404.html          # SPA fallback for deep links
touch dist/.nojekyll
cd dist
rm -rf .git
git init -q -b gh-pages
git add -A
git -c user.name="deploy" -c user.email="deploy@users.noreply.github.com" commit -q -m "Deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push -f https://github.com/regei-sgen/JointCommerce_Template.git gh-pages:gh-pages
rm -rf .git
