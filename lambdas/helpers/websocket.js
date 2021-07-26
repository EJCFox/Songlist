const AWS = require('aws-sdk');
const dynamo = require('./dynamo');

const usersTableName = process.env.usersTableName;

const websocketSend = ({ domainName, stage, connectionId, data }) => {
  const endpoint = `${domainName}/${stage}`;
  const ws = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint,
  });
  const postParams = {
    Data: JSON.stringify(data),
    ConnectionId: connectionId,
  };

  return ws.postToConnection(postParams).promise();
};

const broadcast = async (data) => {
  console.info('Sending data to all connections', data);

  const allConnections = await dynamo.getAll(usersTableName);
  console.debug(allConnections);

  const notifications = allConnections.map(({ ID, domainName, stage }) =>
    websocketSend({
      domainName,
      stage,
      connectionId: ID,
      data,
    })
  );
  await Promise.all(notifications);
};

module.exports = {
  broadcast,
};
