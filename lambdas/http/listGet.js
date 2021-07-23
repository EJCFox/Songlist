const Responses = require('../helpers/API_Responses');
const Dynamo = require('../helpers/Dynamo');

const songListTableName = process.env.songListTableName;

exports.handler = async (event) => {
  console.info('Queue get request received', event);
  const songItems = await Dynamo.getAll(songListTableName);
  return Responses._200(
    songItems.map((item) => ({
      id: item.ID,
      title: item.Title,
      artist: item.Artist,
      numberOfPlays: item.NumberOfPlays,
      lastPlayed: item.LastPlayed ? item.LastPlayed : null,
    }))
  );
};
