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

app.post('/upload-html', async (req, res) => {
    try {
      console.log('Received request to upload HTML file.');
  
      if (!req.files || !req.files.htmlFile) {
        console.log('No HTML file in the request.');
        return res.status(400).json({ error: 'HTML file is required.' });
      }
  
      const htmlFile = req.files.htmlFile;
      const uploadPath = path.join(__dirname, 'uploads', 'uploaded.html');
  
      console.log('Moving the uploaded file to:', uploadPath);
  
      // Move the uploaded file to a designated location
      htmlFile.mv(uploadPath, (err) => {
        if (err) {
          console.error('Error moving the file:', err);
          return res.status(500).json({ error: 'Failed to upload HTML file.' });
        }
  
        console.log('HTML file uploaded successfully.');
        res.json({ message: 'HTML file uploaded successfully.' });
      });
    } catch (error) {
      console.error('Error in /upload-html route:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  


// Define a route for generating EPUBs
app.post('/generate-epub', async (req, res) => {
  // Handle EPUB generation logic here

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
        res.download(epubPath, 'book.epub');
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});