FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Create superuser script
RUN echo '#!/bin/bash\necho "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username=\"admin\").exists() or User.objects.create_superuser(\"admin\", \"admin@example.com\", \"admin\")" | python manage.py shell' > /app/create_superuser.sh
RUN chmod +x /app/create_superuser.sh

# Expose port
EXPOSE 8000

# Start script
CMD ["sh", "-c", "python manage.py migrate && /app/create_superuser.sh && python manage.py runserver 0.0.0.0:8000"]