/**
 * Preload script for Beam Diagnostics Desktop App
 */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  version: '2.5.0'
});
