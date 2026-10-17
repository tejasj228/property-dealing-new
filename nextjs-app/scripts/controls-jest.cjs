const path=require('node:path');
const root=path.resolve(__dirname,'../..'),admin=path.join(root,'admin-panel/node_modules');
module.exports={rootDir:root,testEnvironment:path.join(admin,'jest-environment-jsdom'),testMatch:['**/nextjs-app/scripts/controls.test.jsx'],
 transform:{'^.+\\.[jt]sx?$':[path.join(admin,'babel-jest'),{presets:[[path.join(admin,'babel-preset-react-app'),{runtime:'automatic'}]]}]},
 moduleNameMapper:{'\\.css$':path.join(__dirname,'test-style.cjs'),'^react$':path.join(admin,'react'),'^react/(.*)$':path.join(admin,'react/$1'),'^react-dom$':path.join(admin,'react-dom'),'^react-dom/(.*)$':path.join(admin,'react-dom/$1'),'^@testing-library/react$':path.join(admin,'@testing-library/react'),'^@radix-ui/primitive/is-development$':path.join(root,'nextjs-app/node_modules/@radix-ui/primitive/dist/internal/is-development.false.js')},
 setupFilesAfterEnv:[path.join(__dirname,'test-controls-setup.cjs')]};
