// FileUpload.js
import React, { useState } from 'react';
import Dropzone from 'react-dropzone';
import axios from 'axios';

const FileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [epubLink, setEpubLink] = useState('');

  const handleDrop = (acceptedFiles) => {
    setUploadedFiles(acceptedFiles);
  };

  const handleUpload = async () => {
    // Create a FormData object
    const formData = new FormData();

    // Append the uploaded files
    uploadedFiles.forEach((file, index) => {
      formData.append(`chapter${index + 1}.html`, file);
    });

    // Send the files to the server for EPUB generation
    try {
      const response = await axios.post('/generate-epub', formData);
      setEpubLink(response.data.epubLink);
    } catch (error) {
      console.error('Error generating EPUB:', error);
    }
  };

  return (
    <div>
      <Dropzone onDrop={handleDrop} accept=".html" multiple>
        {({ getRootProps, getInputProps }) => (
          <div {...getRootProps()} className="dropzone">
            <input {...getInputProps()} />
            <p>Drag and drop HTML files here, or click to select files</p>
          </div>
        )}
      </Dropzone>
      <button onClick={handleUpload}>Generate EPUB</button>
      {epubLink && (
        <a href={epubLink} download="book.epub">
          Download EPUB
        </a>
      )}
    </div>
  );
};

export default FileUpload;