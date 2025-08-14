FROM ollama/ollama:latest

# Install wget
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Copy the init script
COPY init-ollama.sh /usr/local/bin/init-ollama.sh
RUN chmod +x /usr/local/bin/init-ollama.sh

# Set the entrypoint
ENTRYPOINT ["/usr/local/bin/init-ollama.sh"]