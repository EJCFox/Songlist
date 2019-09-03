const AWS = require('aws-sdk');

const documentClient = new AWS.DynamoDB.DocumentClient();

const Dynamo = {
    async get(ID, TableName) {
        const params = {
            TableName,
            Key: {
                ID,
            },
        };

        const data = await documentClient.get(params).promise();

        if (!data || !data.Item) {
            throw Error(`There was an error fetching the data for ID of ${ID} from ${TableName}`);
        }
        console.info(data);

        return data.Item;
    },

    async getAll(TableName) {
        const params = {
            TableName
        };

        const data = await documentClient.scan(params).promise();

        if (!data || !data.Items) {
            throw Error(`There was an error fetching the data for ID of ${ID} from ${TableName}`);
        }
        console.info(data);

        return data.Items;
    },

    async write(data, TableName) {
        const params = {
            TableName,
            Item: data,
        };

        const res = await documentClient.put(params).promise();

        if (!res) {
            throw Error(`There was an error inserting data in table ${TableName}`);
        }

        return data;
    },

    async delete(ID, TableName) {
        const params = {
            TableName,
            Key: {
                ID,
            },
        };

        return documentClient.delete(params).promise();
    },
};
module.exports = Dynamo;
