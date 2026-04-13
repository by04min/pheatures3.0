-- 01. PHONEME & FEATURE TABLES

-- PURPOSE: stores all phoneme symbols
CREATE TABLE IF NOT EXISTS phonemes (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    phoneme_symbol TEXT NOT NULL UNIQUE
);

-- PURPOSE: stores all possible features a phoneme can have
CREATE TABLE IF NOT EXISTS features (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_name TEXT NOT NULL UNIQUE
);

-- PURPOSE: relates each phoneme to a feature, with a specified value (+, -, 0)
CREATE TABLE IF NOT EXISTS phoneme_features (
    phoneme_id    INTEGER NOT NULL,
    feature_id    INTEGER NOT NULL,
    feature_value TEXT NOT NULL,

    -- primary key ensures each phoneme can only have one value per feature
    PRIMARY KEY (phoneme_id, feature_id),

    -- foreign keys serve as pointers to other tables
    FOREIGN KEY (phoneme_id) REFERENCES phonemes(id),
    FOREIGN KEY (feature_id) REFERENCES features(id)
);

-- 02. CONTRADICTIONS TABLE

-- PURPOSE: stores all contradictions between features
CREATE TABLE IF NOT EXISTS contradictions (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    bundle TEXT NOT NULL -- bundle of contradictory features as JSON
);

-- 03. DEPENDENCIES TABLE

-- PURPOSE: stores all feature dependencies (ex. if +low, then -high)
CREATE TABLE IF NOT EXISTS dependencies (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    condition   TEXT NOT NULL,  -- the 'if' as JSON; triggers dependency
    consequence TEXT NOT NULL   -- the 'then' as JSON; consequence of dependency
);

-- 04. DIACRITICS TABLE

-- PURPOSE: stores all diacritics and their relationships to phonemes
CREATE TABLE IF NOT EXISTS diacritics (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    diacritic_name   TEXT NOT NULL,
    diacritic_symbol TEXT NOT NULL,
    condition        TEXT NOT NULL,  -- the 'if' as JSON; condition for diacritic
    consequence      TEXT NOT NULL   -- the 'then' as JSON; effect of diacritic
);