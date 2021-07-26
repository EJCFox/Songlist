const response = require('../helpers/apiResponses');

exports.handler = async (event) => {
  console.info('Default hander called', event);
  return response.success('pong');
};
