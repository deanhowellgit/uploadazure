const fileInput = document.getElementById("file-input");
const uploadButton = document.getElementById("upload-button");
const progressBarFill = document.getElementById("progress-bar-fill");
const notification = document.getElementById("notification");

fileInput.addEventListener("change", () => {
  uploadButton.disabled = !fileInput.files.length;
});

uploadButton.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Response:", errorText);
      throw new Error("Upload failed: " + errorText);
    }

    const result = await response.json();
    console.log(result);
    showNotification("File uploaded successfully!", "success");
  } catch (error) {
    console.error("Error:", error);
    showNotification("File upload failed. Please try again.", "error");
  }
});

function showNotification(message, type) {
  notification.textContent = message;
  notification.className = type;
  notification.style.display = "block";

  setTimeout(() => {
    notification.style.display = "none";
  }, 5000);
}

// This function would be called by the backend to update progress
// In a real implementation, you might use WebSockets or Server-Sent Events for this
function updateProgress(progress) {
  progressBarFill.style.width = `${progress}%`;
}
