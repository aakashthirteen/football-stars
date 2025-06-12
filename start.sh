#!/bin/bash
npm install --production=false
npm run build
node dist/server.js