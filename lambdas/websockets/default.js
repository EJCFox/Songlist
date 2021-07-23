const Responses = require('../helpers/API_Responses');

exports.handler = async (event) => {
  console.info('Default hander called', event);
  return Responses._200('pong');
};
