#!/bin/bash

if [ "$VERCEL_ENV" = "production" ]; then
  echo "Production build: deploying Convex"
  npx convex deploy --cmd "npm run build"
else
  echo "Preview build: skipping Convex deploy"
  npm run build
fi