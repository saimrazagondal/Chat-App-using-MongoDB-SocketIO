const mongo = require("mongodb").MongoClient;
const client = require("socket.io").listen(4000).sockets;

//Connect to mongoDB
mongo.connect("mongodb://127.0.0.1", { useUnifiedTopology: true }, (err, c) => {
  if (err) {
    throw err;
  }

  const db = c.db("mongochat");

  console.log("MongoDB connected...");

  //Connect to sokcet
  client.on("connection", (socket) => {
    let chat = db.collection("chats");

    //Create function to send status
    sendStatus = (s) => {
      socket.emit("status", s);
    };

    //Get chats from mongo collection
    chat
      .find()
      .limit(100)
      .sort({ _id: 1 })
      .toArray((err, result) => {
        if (err) {
          throw err;
        }

        //emit messages
        socket.emit("output", result);
      });

    //Handle input events
    socket.on("input", (data) => {
      const { name, message } = data;
      //check for name and message
      if (name === "" || message === "") {
        //send error status
        sendStatus("Please enter a name and message");
      } else {
        //Insert into db
        chat.insertOne({ name, message }, () => {
          client.emit("output", [data]);
          //send status object
          sendStatus({
            message: "Message sent!",
            clear: true,
          });
        });
      }
    });

    //Handle clear
    socket.on("clear", (data) => {
      //remove all chats from the collection
      chat.deleteMany({}, () => {
        socket.emit("cleared");
      });
    });
  });
});
