CREATE TABLE questions (
  id serial PRIMARY KEY,
  title text NOT NULL UNIQUE,
  username text NOT NULL
);

CREATE TABLE answers (
  id serial PRIMARY KEY,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  question_id integer NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  username text NOT NULL
);

CREATE TABLE users (
  username text PRIMARY KEY,
  password text NOT NULL
);