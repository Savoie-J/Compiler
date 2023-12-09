import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function App() {
  const [files, setFiles] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');

  const serverUrl = 'http://localhost:52875';

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles);
    setUploadMessage(`${acceptedFiles.length} file(s) selected`);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: '.html',
  });
  

  const handleUpload = () => {
    if (!files || files.length === 0) {
      setUploadMessage('Please select at least one file before uploading.');
      return;
    }

    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('htmlFiles', file);
    });

    // Include the order of files in the FormData
    files.forEach((file, index) => {
      formData.append('fileOrder[]', file.name);
    });

    fetch(`${serverUrl}/upload-html`, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => setUploadMessage(`Upload successful: ${data.message}`))
      .catch((error) => {
        console.error('Error:', error);
        setUploadMessage('Error uploading the files.');
      });
  };

  const handleGenerateEpub = () => {
    fetch(`${serverUrl}/generate-epub`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'book.epub';
        a.click();
        window.URL.revokeObjectURL(url);
        // Clear the files after generating EPUB
        setFiles([]);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const updatedFiles = Array.from(files);
    const [removed] = updatedFiles.splice(result.source.index, 1);
    updatedFiles.splice(result.destination.index, 0, removed);

    setFiles(updatedFiles);
  };

  // Add this CSS or adjust as needed
  const draggableStyle = {
    padding: '8px',
    margin: '0 0 8px 0',
    backgroundColor: '#f8f8f8',
    borderRadius: '4px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  };

  return (
    <div>
      <div {...getRootProps()} style={{ border: '1px dashed #ccc', padding: '20px', margin: '20px' }}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop HTML files here, or click to select files</p>
      </div>
      <p>{uploadMessage}</p>
      {files.length > 0 && (
        <div>
          <h3>Uploaded Files</h3>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="fileList">
              {(provided) => (
                <ul ref={provided.innerRef} {...provided.droppableProps}>
                  {files.map((file, index) => (
                    <Draggable key={index} draggableId={`file-${index}`} index={index}>
                      {(provided) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{ ...draggableStyle, ...provided.draggableProps.style }}
                        >
                          {file.name}
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
      <button onClick={handleUpload}>Upload HTML</button>
      <button onClick={handleGenerateEpub}>Generate EPUB</button>
    </div>
  );  
}

export default App;