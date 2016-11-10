var digestRequest = require('request-digest')('username', 'password');
digestRequest.request({
  host: 'abalobi-fisher.appspot.com',
  method: 'GET',
  headers: {
    'username': 'test',
    'password': 't3stt3st'
  }
}, function (error, response, body) {
  if (error) {
    throw error;
  }
  console.log(body);
});
