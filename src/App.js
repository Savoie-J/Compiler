import React, { useState } from 'react';

function App() {
  const [file, setFile] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');

  const serverUrl = 'http://localhost:52875';

  const handleFileUpload = (event) => {
    const uploadedFiles = event.target.files;
    setFile(uploadedFiles);
    setUploadMessage(`${uploadedFiles.length} file(s) selected`);
  };

  const handleUpload = () => {
    if (!file || file.length === 0) {
      setUploadMessage('Please select at least one file before uploading.');
      return;
    }

    // Create a FormData object and append each uploaded file
    const formData = new FormData();
    for (let i = 0; i < file.length; i++) {
      formData.append('htmlFiles', file[i]);
    }

    // Send the HTML files to the server
    fetch(`${serverUrl}/upload-html`, {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json(); // Assuming the server responds with JSON data
      })
      .then((data) => {
        // Handle the response data, e.g., display a success message
        setUploadMessage(`Upload successful: ${data.message}`);
      })
      .catch((error) => {
        console.error('Error:', error);
        setUploadMessage('Error uploading the files.');
      });
  };

  const handleGenerateEpub = () => {
    // Send a request to the server to generate the EPUB
    fetch(`${serverUrl}/generate-epub`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.blob();
      })
      .then((blob) => {
        // Handle the generated EPUB, e.g., offer it for download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'book.epub';
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  return (
    <div>
      <input type="file" onChange={handleFileUpload} multiple />
      <p>{uploadMessage}</p>
      <button onClick={handleUpload}>Upload HTML</button>
      <button onClick={handleGenerateEpub}>Generate EPUB</button>
    </div>
  );
}

export default App;
