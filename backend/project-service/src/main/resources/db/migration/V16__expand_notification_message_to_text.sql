-- Admin bell entries can carry long demand summaries.
ALTER TABLE notifications
    ALTER COLUMN message TYPE TEXT;
