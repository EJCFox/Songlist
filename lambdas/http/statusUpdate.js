const response = require('../helpers/apiResponses');
const dynamo = require('../helpers/dynamo');
const validation = require('../helpers/parameterValidation');
const websocket = require('../helpers/websocket');
const { isAdminRequest } = require('../helpers/adminHelper');

const configTableName = process.env.configTableName;

exports.handler = async (event) => {
  console.info('Set status request event received', event);

  if (!(await isAdminRequest(event))) {
    return response.unauthorized({
      message: 'Unauthorized: only admins can open/close requests',
    });
  }

  const body = JSON.parse(event.body);

  if (!validation.isRequiredBoolean(body.requestsOpen)) {
    return response.badRequest({ message: 'Invalid status' });
  }

  await dynamo.write(
    { ConfigKey: 'RequestsOpen', ConfigValue: body.requestsOpen },
    configTableName
  );
  await websocket.broadcast({
    action: 'statusUpdate',
    data: { requestsOpen: body.requestsOpen },
  });
  return response.successNoContent;
};
