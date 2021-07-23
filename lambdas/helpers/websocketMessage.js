const AWS = require('aws-sdk');

const create = (domainName, stage) => {
    const endpoint = `${domainName}/${stage}`;
    return new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint,
    });
};

const send = ({ domainName, stage, connectionId, data }) => {
    const ws = create(domainName, stage);

    const postParams = {
        Data: JSON.stringify(data),
        ConnectionId: connectionId,
    };

    return ws.postToConnection(postParams).promise();
};

const close = ({ domainName, stage, connectionId }) => {
    const ws = create(domainName, stage);

    const deleteParams = {
        ConnectionId: connectionId,
    };

    return ws.deleteConnection(deleteParams).promise();
};

module.exports = {
    send,
    close
};
