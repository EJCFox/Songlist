const WebSocket = require('../common/websocketMessage');
const Dynamo = require('../common/Dynamo');

const usersTableName = process.env.usersTableName;

const broadcast = async (data) => {
  console.info('Sending data to all connections', data);

  const allConnections = await Dynamo.getAll(usersTableName);
  console.debug(allConnections);

  const notifications = allConnections.map(({ ID, domainName, stage }) => 
      WebSocket.send({
          domainName,
          stage,
          connectionId: ID,
          data,
      })
  )
  await Promise.all(notifications);
}

module.exports = {
  broadcast
}