-- Initialize the facilities feedback database

-- Create consolidated feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id VARCHAR(50) PRIMARY KEY,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    user_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'low',
    manual_review BOOLEAN DEFAULT FALSE,
    duplicate_of VARCHAR(50) REFERENCES feedback(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_location ON feedback(location);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_manual_review ON feedback(manual_review);
CREATE INDEX IF NOT EXISTS idx_feedback_duplicate_of ON feedback(duplicate_of);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on feedback
CREATE TRIGGER update_feedback_updated_at 
    BEFORE UPDATE ON feedback 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();