require("dotenv").config();
const { BlobServiceClient } = require("@azure/storage-blob");
const Busboy = require("busboy");

module.exports = async function (context, req) {
  context.log("JavaScript HTTP trigger function processed a request.");

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
  if (!connectionString || !containerName) {
    context.res = {
      status: 500,
      body: { message: "Connection string is not set" },
    };
    return;
  }

  try {
    const file = await new Promise((resolve, reject) => {
      const busboy = Busboy({ headers: req.headers });
      let fileBuffer;
      let fileName;

      busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        context.log("File [" + fieldname + "]: filename: " + filename.filename);
        fileName = filename.filename;
        const chunks = [];
        file.on("data", (data) => {
          context.log("File [" + fieldname + "] got " + data.length + " bytes");
          chunks.push(data);
        });
        file.on("end", () => {
          context.log("File [" + fieldname + "] Finished");
          fileBuffer = Buffer.concat(chunks);
        });
      });

      busboy.on("finish", () => {
        context.log("Done parsing form!");
        if (fileBuffer && fileName) {
          resolve({ buffer: fileBuffer, name: fileName });
        } else {
          reject(new Error("No file uploaded"));
        }
      });

      busboy.write(req.body);
      busboy.end();
    });

    if (!file) {
      throw new Error("No file uploaded");
    }

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    // console.log("~~~~file~~~~~");
    // console.log(file.name);
    const blobName = `${Date.now()}-${file.name}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    context.log("blobName: ", blobName);
    console.log(file.buffer);
    await blockBlobClient.upload(file.buffer, file.buffer.length);

    context.res = {
      body: { message: "File uploaded successfully" },
    };
  } catch (error) {
    context.log("Error:", error);
    context.res = {
      status: 500,
      body: { message: "Error uploading file", error: error.message },
    };
  }
};
