-- Public contact / simulator messages can exceed 255 characters.
ALTER TABLE demands
    ALTER COLUMN description TYPE TEXT;
