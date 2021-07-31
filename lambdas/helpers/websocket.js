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

  const notifications = allConnections.map(
    async ({ ID, domainName, stage }) => {
      try {
        await websocketSend({
          domainName,
          stage,
          connectionId: ID,
          data,
        });
      } catch (error) {
        console.info(`Could not broadcast to connectionId ${ID}`, error);
      }
    }
  );
  await Promise.allSettled(notifications);
};

module.exports = {
  broadcast,
};
