// server/index.js
const express = require('express');
const app = express();
const epubgen = require('epub-gen');
const bodyParser = require('body-parser'); // Middleware for parsing JSON data
const fs = require('fs'); // Node.js file system module
const path = require('path');
const util = require('util');
const cors = require('cors'); // Import the cors middleware
const fileUpload = require('express-fileupload'); // Import express-fileupload


const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

const port = 52875;

// Enable CORS
app.use(cors());

// Configure body-parser to parse JSON data
app.use(bodyParser.json());

app.use(fileUpload()); 

// server/index.js

app.post('/upload-html', async (req, res) => {
  try {
    console.log('Received request to upload HTML files.');

    if (!req.files || !req.files.htmlFiles || req.files.htmlFiles.length === 0) {
      console.log('No HTML files in the request.');
      return res.status(400).json({ error: 'HTML files are required.' });
    }

    const htmlFiles = req.files.htmlFiles;
    const uploadPath = path.join(__dirname, 'uploads');

    console.log('Moving the uploaded files to:', uploadPath);

    // Ensure the 'uploads' directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }

    // Move each uploaded file to the 'uploads' directory
    htmlFiles.forEach((file, index) => {
      const filePath = path.join(uploadPath, `uploaded${index + 1}.html`);
      file.mv(filePath, (err) => {
        if (err) {
          console.error('Error moving the file:', err);
          return res.status(500).json({ error: 'Failed to upload HTML files.' });
        }
      });
    });

    console.log('HTML files uploaded successfully.');
    res.json({ message: 'HTML files uploaded successfully.' });
  } catch (error) {
    console.error('Error in /upload-html route:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



  
// server/index.js

// ... (other imports and configurations)

app.post('/generate-epub', async (req, res) => {
  try {
    // Read all files from the 'uploads' directory
    const files = await readdir(path.join(__dirname, 'uploads'));

    const content = [];

    // Read the content of each HTML file and use it as a chapter in the EPUB
    for (let i = 0; i < files.length; i++) {
      const fileContent = await readFile(path.join(__dirname, 'uploads', files[i]), 'utf8');

      content.push({
        title: `Chapter ${i + 1}`,
        data: fileContent,
      });
    }

    // Define EPUB generation options
    const options = {
      title: 'EPUB Compiler',
      author: 'Jared Savoie',
      output: path.join(__dirname, 'generated', 'book.epub'), // Output path for the generated EPUB
      content,
    };

    // Generate the EPUB
    new epubgen(options)
      .promise
      .then(() => {
        // Successfully generated the EPUB
        const epubPath = options.output;

        // Send the generated EPUB as a download to the client
        res.download(epubPath, 'book.epub', (err) => {
          if (err) {
            console.error('Error sending EPUB for download:', err);
            res.status(500).json({ error: 'Failed to send EPUB for download.' });
          } else {
            // Delete the uploaded HTML files after successful download
            deleteUploadedHTMLFiles();
          }
        });
      })
      .catch((err) => {
        console.error('Error generating EPUB:', err);
        res.status(500).json({ error: 'Failed to generate EPUB.' });
      });
  } catch (err) {
    console.error('Error reading files:', err);
    res.status(500).json({ error: 'Failed to read HTML files.' });
  }
});

// Function to delete the uploaded HTML files
function deleteUploadedHTMLFiles() {
  const uploadPath = path.join(__dirname, 'uploads');

  fs.readdir(uploadPath, (err, files) => {
    if (err) {
      console.error('Error reading files in the uploads directory:', err);
    } else {
      // Delete each file in the 'uploads' directory
      files.forEach((file) => {
        const filePath = path.join(uploadPath, file);
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting file:', unlinkErr);
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