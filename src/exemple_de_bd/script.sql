DROP DATABASE IF EXISTS MOTS;
CREATE DATABASE MOTS;
USE MOTS;
CREATE TABLE mots (
    id INT NOT NULL AUTO_INCREMENT,
    mot VARCHAR(50) NOT NULL,
    theme VARCHAR(50),
    PRIMARY KEY (id)
);
INSERT INTO mots (mot, theme)
VALUES ('chat', 'animaux');
INSERT INTO mots (mot, theme)
VALUES ('chien', 'animaux');
INSERT INTO mots (mot, theme)
VALUES ('vache', 'animaux');
SELECT *
FROM mots;
