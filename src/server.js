// server.js
const express = require('express');
const app = express();
const fileUpload = require('express-fileupload');
const Epub = require('epub-gen');

app.use(fileUpload());

app.post('/generate-epub', (req, res) => {
  if (!req.files || !req.files.chapter1 || !req.files.chapter2) {
    return res.status(400).send('At least two HTML files are required');
  }

  const chapters = [];
  for (let i = 1; i <= 2; i++) {
    chapters.push({
      title: `Chapter ${i}`,
      content: req.files[`chapter${i}`].data.toString('utf8'),
    });
  }

  const options = {
    title: 'My EPUB Book',
    author: 'Your Name',
    content: chapters,
  };

  new Epub(options, 'public/book.epub').promise.then(() => {
    res.json({ epubLink: '/book.epub' });
  });
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});

app.use(express.static('public'));