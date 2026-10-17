process.env.NODE_ENV='test';
require('../../admin-panel/node_modules/jest').run(['--config',require('node:path').join(__dirname,'controls-jest.cjs'),'--runInBand']);
