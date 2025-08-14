#!/bin/bash

# Start Ollama in background
ollama serve &

# Wait for Ollama to be ready
echo "Waiting for Ollama server to start..."
while ! wget -q --spider http://localhost:11434/api/version; do
  sleep 1
done

# Check if model already exists
if ollama list | grep -q "${OLLAMA_MODEL}"; then
  echo "Model ${OLLAMA_MODEL} already exists, skipping download"
else
  echo "Model ${OLLAMA_MODEL} not found, downloading..."
  ollama pull ${OLLAMA_MODEL}
fi

# Keep the container running
wait