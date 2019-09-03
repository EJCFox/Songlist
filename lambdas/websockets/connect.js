const Responses = require('../common/API_Responses');
const Dynamo = require('../common/Dynamo');

const usersTableName = process.env.usersTableName;

exports.handler = async event => {
    console.log('event', event);

    const { connectionId, domainName, stage } = event.requestContext;

    const data = {
        ID: connectionId,
        date: Date.now(),
        domainName,
        stage,
    };

    await Dynamo.write(data, usersTableName);

    return Responses._200({ message: 'connected' });
};
