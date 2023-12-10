const express = require("express");
const app = express();
const epubgen = require("epub-gen");
const bodyParser = require("body-parser");
const fs = require("fs"); 
const path = require("path");
const util = require("util");
const cors = require("cors");
const fileUpload = require("express-fileupload");

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

const port = 52875;

app.use(cors());

app.use(bodyParser.json());

app.use(fileUpload());

app.post("/upload-html", async (req, res) => {
  try {
    console.log("Received request to upload HTML files.");

    if (
      !req.files ||
      !req.files.htmlFiles ||
      req.files.htmlFiles.length === 0
    ) {
      console.log("No HTML files in the request.");
      return res.status(400).json({ error: "HTML files are required." });
    }

    const htmlFiles = req.files.htmlFiles;
    const uploadPath = path.join(__dirname, "uploads");

    console.log("Moving the uploaded files to:", uploadPath);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }

    htmlFiles.forEach((file, index) => {
      const filePath = path.join(uploadPath, `uploaded${index + 1}.html`);
      file.mv(filePath, (err) => {
        if (err) {
          console.error("Error moving the file:", err);
          return res
            .status(500)
            .json({ error: "Failed to upload HTML files." });
        }
      });
    });

    console.log("HTML files uploaded successfully.");
    res.json({ message: "HTML files uploaded successfully." });
  } catch (error) {
    console.error("Error in /upload-html route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/generate-epub", async (req, res) => {
  try {
    const files = await readdir(path.join(__dirname, "uploads"));

    const content = [];

    for (let i = 0; i < files.length; i++) {
      const fileContent = await readFile(
        path.join(__dirname, "uploads", files[i]),
        "utf8"
      );

      content.push({
        title: `Chapter ${i + 1}`,
        data: fileContent,
      });
    }

    const options = {
      title: "EPUB Compiler",
      author: "Jared Savoie",
      output: path.join(__dirname, "generated", "book.epub"),
      content,
    };

    new epubgen(options).promise
      .then(() => {
        const epubPath = options.output;

        res.download(epubPath, "book.epub", (err) => {
          if (err) {
            console.error("Error sending EPUB for download:", err);
            res
              .status(500)
              .json({ error: "Failed to send EPUB for download." });
          } else {
            deleteUploadedHTMLFiles();
          }
        });
      })
      .catch((err) => {
        console.error("Error generating EPUB:", err);
        res.status(500).json({ error: "Failed to generate EPUB." });
      });
  } catch (err) {
    console.error("Error reading files:", err);
    res.status(500).json({ error: "Failed to read HTML files." });
  }
});

function deleteUploadedHTMLFiles() {
  const uploadPath = path.join(__dirname, "uploads");

  fs.readdir(uploadPath, (err, files) => {
    if (err) {
      console.error("Error reading files in the uploads directory:", err);
    } else {
      files.forEach((file) => {
        const filePath = path.join(uploadPath, file);
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting file:", unlinkErr);
          } else {
            console.log(`Deleted file: ${filePath}`);
          }
        });
      });
    }
  });
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});