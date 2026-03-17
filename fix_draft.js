const fs = require('fs');
const filePath = 'C:\\Users\\user\\AppData\\Local\\Temp\\postman-draft-77217222-a93e-40c7-880a-4512f86cf67a.request.yaml';
const content = `type: http
name: ""
url: 'https://global-olive-iota.vercel.app/api/likes'
method: POST
queryParams: []
body:
  type: json
  content: '{"likeeId": ""}'
auth:
  type: bearer
  bearer: []
`;
fs.writeFileSync(filePath, content, 'utf8');
console.log('File written successfully');
console.log(fs.readFileSync(filePath, 'utf8'));
