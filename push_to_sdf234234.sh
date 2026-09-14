#!/bin/bash
echo "Pushing to sdf234234 - Node 24.x fix"
git init
git config user.email "uzzirulzz@gmail.com"
git config user.name "uzzirulzz-cyber"
git add .
git commit -m "sdf234234 v3.0.2 - Node 24.x fix - Crash fixed"
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/uzzirulzz-cyber/sdfsdf233.git
git push -u origin main --force
echo "Pushed to sdf234234"
