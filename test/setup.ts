/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

// Test setup file
// Add global test utilities and mocks here

// Mock n8n-workflow
jest.mock('n8n-workflow', () => ({
  IExecuteFunctions: jest.fn(),
  INodeExecutionData: jest.fn(),
  INodeType: jest.fn(),
  INodeTypeDescription: jest.fn(),
  NodeConnectionType: {
    Main: 'main',
  },
}));

// Set test timeout
jest.setTimeout(30000);

// Global test utilities
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
