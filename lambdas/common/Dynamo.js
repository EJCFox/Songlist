const AWS = require('aws-sdk');

const documentClient = new AWS.DynamoDB.DocumentClient();

const Dynamo = {
    async exists(Key, TableName) {
        const params = {
            TableName,
            Key,
        };

        const data = await documentClient.get(params).promise();
        return !!data && !!data.Item;
    },

    async get(Key, TableName) {
        const params = {
            TableName,
            Key,
        };

        const data = await documentClient.get(params).promise();

        if (!data || !data.Item) {
            throw Error(`There was an error fetching the data for ID of ${ID} from ${TableName}`);
        }
        console.debug(data);

        return data.Item;
    },

    async getAll(TableName) {
        const params = {
            TableName
        };

        const data = await documentClient.scan(params).promise();

        if (!data || !data.Items) {
            throw Error(`There was an error fetching the data ${TableName}`);
        }
        console.debug(data);

        return data.Items;
    },

    async search(FilterExpression, ExpressionAttributeValues, TableName) {
        const params = {
            TableName,
            FilterExpression,
            ExpressionAttributeValues,
        };

        const data = await documentClient.scan(params).promise();

        if (!data || !data.Items) {
            throw Error(`There was an error searching for items in ${TableName}`);
        }
        console.debug(data);

        return data.Items;
    },

    async write(data, TableName, ConditionExpression) {
        const params = {
            TableName,
            Item: data,
            ConditionExpression
        };

        const res = await documentClient.put(params).promise();

        if (!res) {
            throw Error(`There was an error inserting data in table ${TableName}`);
        }

        return data;
    },

    async delete(Key, TableName, ConditionExpression) {
        const params = {
            TableName,
            Key,
            ConditionExpression
        };

        return documentClient.delete(params).promise();
    },
};
module.exports = Dynamo;
