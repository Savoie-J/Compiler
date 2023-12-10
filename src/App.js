import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  backgroundColor: "#111",
  color: "#fff",
};

const dropzoneStyle = {
  border: "2px dashed #fff",
  padding: "20px",
  margin: "20px",
  textAlign: "center",
  cursor: "pointer",
  userSelect: "none",
};

const fileListStyle = {
  listStyleType: "none",
  padding: 0,
  textAlign: "center",
};

const draggableStyle = {
  padding: "8px",
  margin: "0 0 8px 0",
  backgroundColor: "#222", 
  borderRadius: "4px",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
};

const buttonStyle = {
  backgroundColor: "#fff",
  color: "#111", 
  padding: "10px 20px",
  margin: "10px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const removeButtonStyle = {
  marginLeft: "10px",
  backgroundColor: "transparent",
  color: "red",
  border: "none",
  cursor: "pointer",
};

function App() {
  const [files, setFiles] = useState([]);
  const [uploadMessage, setUploadMessage] = useState("");

  const serverUrl = "http://localhost:52875";

  const onDrop = useCallback(
    (acceptedFiles) => {
      setFiles((prevFiles) => {
        return [...prevFiles, ...acceptedFiles];
      });
      setUploadMessage(
        `${files.length + acceptedFiles.length} file(s) selected`
      );
    },
    [files]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: ".html",
  });

  const inputProps = getInputProps({ multiple: true });

  const handleUpload = () => {
    setFiles([]);
    setUploadMessage("");

    if (!files || files.length === 0) {
      setUploadMessage("Please select at least one file before uploading.");
      return;
    }

    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("htmlFiles", files[i]);
      formData.append("fileOrder[]", files[i].name);
    }

    fetch(`${serverUrl}/upload-html`, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => setUploadMessage(`Upload successful: ${data.message}`))
      .catch((error) => {
        console.error("Error:", error);
        setUploadMessage("Error uploading the files.");
      });
  };

  const handleGenerateEpub = () => {
    fetch(`${serverUrl}/generate-epub`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "book.epub";
        a.click();
        window.URL.revokeObjectURL(url);
        setFiles([]);
      })
      .catch((error) => {
        console.error("Error:", error);
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

  const handleRemoveFile = (indexToRemove) => {
    const updatedFiles = files.filter((file, index) => index !== indexToRemove);
    setFiles(updatedFiles);
    setUploadMessage(`${updatedFiles.length} file(s) selected`);
  };

  return (
    <div style={containerStyle}>
      <div {...getRootProps()} style={dropzoneStyle}>
        <input {...inputProps} />
        <p>Drag & drop HTML files here, or click to browse files</p>
      </div>
      <p>{uploadMessage}</p>
      {files.length > 0 && (
        <div>
          <h3>Uploaded Files</h3>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="fileList">
              {(provided) => (
                <ul
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={fileListStyle}
                >
                  {files.map((file, index) => (
                    <Draggable
                      key={index}
                      draggableId={`file-${index}`}
                      index={index}
                    >
                      {(provided) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...draggableStyle,
                            ...provided.draggableProps.style,
                          }}
                        >
                          {file.name}
                          <FontAwesomeIcon
                            icon={faTrashAlt}
                            style={removeButtonStyle}
                            onClick={() => handleRemoveFile(index)}
                          />
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
      <button style={buttonStyle} onClick={handleUpload}>
        Upload HTML
      </button>
      <button style={buttonStyle} onClick={handleGenerateEpub}>
        Generate EPUB
      </button>
    </div>
  );
}

export default App;