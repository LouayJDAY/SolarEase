CREATE TABLE IF NOT EXISTS quote_sequences (
    year        INT PRIMARY KEY,
    last_number INT NOT NULL DEFAULT 0
);
