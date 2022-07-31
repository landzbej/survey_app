// const SeedData = require("./seed-data");
// const deepCopy = require("./deep-copy");
// const { sortQuestions, sortAnswers } = require("./sort");
// const nextId = require("./next-id");
const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");

module.exports = class PgPersistence {
  // async testQuery1() {
  //   const SQL = "SELECT * FROM questions";

  //   let result = await dbQuery(SQL);
  //   console.log("query1", result.rows);
  // }

  // async testQuery2() {
  //   const SQL = "SELECT * FROM answers";

  //   let result = await dbQuery(SQL);
  //   console.log("query2", result.rows);
  // }

  // async testQuery3(title) {
  //   const SQL = "SELECT * FROM answers WHERE title = $1";

  //   let result = await dbQuery(SQL, title);
  //   console.log("query3", result.rows);
  // }

  constructor(session) {
    this.username = session.username;
  }

  // Mark all answers on the answer list as done. Returns `true` on success,
  // `false` if the answer list doesn't exist. The answer list ID must be numeric.
  async authenticate(username, password) {
    const AUTHENTICATED = "SELECT password FROM users WHERE username = $1";
    let result = await dbQuery(AUTHENTICATED, username);
    if (result.rowCount === 0) return false;
    return bcrypt.compare(password, result.rows[0].password);
  }
  
  async completeAllAnswers(questionId) {
    const COMPLETE_ANSWERS = "UPDATE answers SET done = TRUE "
    + "WHERE question_id = $1 AND username = $2 AND NOT done";
    let result = await dbQuery(COMPLETE_ANSWERS, questionId, this.username);
    return result.rowCount > 0;
    // let question = this._findQuestion(questionId);
    // if (!question) return false;

    // question.answers.filter(answer => !answer.done)
    //               .forEach(answer => (answer.done = true));
    // return true;
  }

  // Create a new answer with the specified title and add it to the indicated answer
  // list. Returns `true` on success, `false` on failure.
  async createAnswer(questionId, title) {
    const CREATED_ANSWER = "INSERT INTO answers (question_id, title, username) VALUES ($1, $2, $3)";
    let result = await dbQuery(CREATED_ANSWER, questionId, title, this.username);
    return result.rowCount > 0;
    // let question = this._findQuestion(questionId);
    // if (!question) return false;

    // question.answers.push({
    //   title,
    //   id: nextId(),
    //   done: false,
    // });

    // return true;
  }

  // Create a new answer list with the specified title and add it to the list of
  // answer lists. Returns `true` on success, `false` on failure. (At this time,
  // there are no known failure conditions.)
  async createQuestion(title) {
    const NEW_QUESTION = "INSERT INTO questions (title, username) VALUES ($1, $2)";
    let result = await dbQuery(NEW_QUESTION, title, this.username);
    return result.rowCount > 0;
    // this._questions.push({
    //   title,
    //   id: nextId(),
    //   answers: [],
    // });

    // return true;
  }

  // Delete the specified answer from the specified answer list. Returns `true` on
  // success, `false` if the answer or answer list doesn't exist. The id arguments
  // must both be numeric.
  async deleteAnswer(questionId, answerId) {
    const DELETED_ANSWER = "DELETE FROM answers WHERE question_id = $1 AND id = $2 AND username = $3";
    let result = await dbQuery(DELETED_ANSWER, questionId, answerId, this.username);
    return result.rowCount > 0;
    // let question = this._findQuestion(questionId);
    // if (!question) return false;

    // let answerIndex = question.answers.findIndex(answer => answer.id === answerId);
    // if (answerIndex === -1) return false;

    // question.answers.splice(answerIndex, 1);
    // return true;
  }

  // Delete a answer list from the list of answer lists. Returns `true` on success,
  // `false` if the answer list doesn't exist. The ID argument must be numeric.
  async deleteQuestion(questionId) {
    const DELETED_QUESTION = "DELETE FROM questions WHERE id = $1 AND username = $2";
    let result = await dbQuery(DELETED_QUESTION, questionId, this.username);
    return result.rowCount > 0;
    // let questionIndex = this._questions.findIndex(question => {
    //   return question.id === questionId;
    // });

    // if (questionIndex === -1) return false;

    // this._questions.splice(questionIndex, 1);
    // return true;
  }

  // Returns `true` if a answer list with the specified title exists in the list
  // of answer lists, `false` otherwise.
  async existsQuestionTitle(title) {
    const FIND_QUESTION = "SELECT null FROM questions WHERE title = $1 AND username = $2";
    let result = await dbQuery(FIND_QUESTION, title, this.username);
    return result.rowCount > 0;
  //   return this._questions.some(question => question.title === title);
  }

  // // Does the answer list have any undone answers? Returns true if yes, false if no.
  hasUndoneAnswers(question) {
    return question.answers.some(answer => !answer.done);
  }

  // Are all of the answers in the answer list done? If the answer list has at least
  // one answer and all of its answers are marked as done, then the answer list is
  // done. Otherwise, it is undone.
  isDoneQuestion(question) {
    return question.answers.length > 0 && question.answers.every(answer => answer.done);
  }

  // Returns `true` if `error` seems to indicate a `UNIQUE` constraint
  // violation, `false` otherwise.
  isUniqueConstraintViolation(_error) {
return false;
  }

  // Returns a copy of the indicated answer in the indicated answer list. Returns
  // `undefined` if either the answer list or the answer is not found. Note that
  // both IDs must be numeric.
  async loadAnswer(questionId, answerId) {
    const ANSWER = "SELECT * FROM answers WHERE question_id = $1 AND id = $2 AND username = $3";
    let result = await dbQuery(ANSWER, questionId, answerId, this.username);
    return result.rows[0];
    // let answer = this._findAnswer(questionId, answerId);
    // return deepCopy(answer);
  }

  // Returns a copy of the answer list with the indicated ID. Returns `undefined`
  // if not found. Note that `questionId` must be numeric.
  async loadQuestion(questionId) {
    const LOADED_QUESTION = "SELECT * FROM questions WHERE id = $1 AND username = $2";
    const LOADED_ANSWERS = "SELECT * FROM answers WHERE question_id = $1 AND username = $2";

    let resultQuestion = dbQuery(LOADED_QUESTION, questionId, this.username);
    let resultAnswers = dbQuery(LOADED_ANSWERS, questionId, this.username);
    let result = await Promise.all([resultQuestion, resultAnswers]);

    let question = result[0].rows[0];
    if(!question) return undefined;

    question.answers = result[1].rows;
    return question;

    return result;

  }

  _partitionQuestions(questions) {
    let undone = [];
    let done = [];
    
    questions.forEach(question => {
      if (this.isDoneQuestion(question)) {
        done.push(question);
      } else {
        undone.push(question);
      }
    });

    return undone.concat(done);
  }
  // Set a new title for the specified answer list. Returns `true` on success,
  // `false` if the answer list isn't found. The answer list ID must be numeric.
  async setQuestionTitle(questionId, title) {
    const SET_TITLE = "UPDATE questions SET title = $2 WHERE id = $1 AND username = $3";
    let result = await dbQuery(SET_TITLE, questionId, title, this.username);
    return result.rowCount > 0;
    // let question = this._findQuestion(questionId);
    // if (!question) return false;

    // question.title = title;
    // return true;
  }

  // Return the list of answer lists sorted by completion status and title (case-
  // insensitive).
  async sortedQuestions() {
    const ALL_QUESTIONS = "SELECT * FROM questions" +
                          "  WHERE username = $1" +
                          "  ORDER BY lower(title) ASC";
    const ALL_ANSWERS =     "SELECT * FROM answers" +
                          "  WHERE username = $1";
  
    let resultQuestions = dbQuery(ALL_QUESTIONS, this.username);
    let resultAnswers = dbQuery(ALL_ANSWERS, this.username);
    let resultBoth = await Promise.all([resultQuestions, resultAnswers]);
  
    let allQuestions = resultBoth[0].rows;
    let allAnswers = resultBoth[1].rows;
    if (!allQuestions || !allAnswers) return undefined;
  
    allQuestions.forEach(question => {
      question.answers = allAnswers.filter(answer => {
        return question.id === answer.question_id;
      });
    });
  
    return this._partitionQuestions(allQuestions);
  }

  // Returns a copy of the list of answers in the indicated answer list by sorted by
  // completion status and title (case-insensitive).
  async sortedAnswers(question) {
    // let answers = question.answers;
    // let undone = answers.filter(answer => !answer.done);
    // let done = answers.filter(answer => answer.done);
    // return deepCopy(sortAnswers(undone, done));
    const SORTED_ANSWERS = "SELECT * FROM answers WHERE question_id = $1 AND username = $2 ORDER BY done ASC, lower(title) ASC";
    let result = await dbQuery(SORTED_ANSWERS, question.id, this.username);
    return result.rows;
  }

  // Toggle a answer between the done and not done state. Returns `true` on
  // success, `false` if the answer or answer list doesn't exist. The id arguments
  // must both be numeric.
  async toggleDoneAnswer(questionId, answerId) {
    const TOGGLE_DONE = "UPDATE answers SET done = NOT done WHERE question_id = $1 AND id = $2 AND username = $3";
    let result = await dbQuery(TOGGLE_DONE, questionId, answerId, this.username);
    return result.rowCount > 0;
    // let answer = this._findAnswer(questionId, answerId);
    // if (!answer) return false;

    // answer.done = !answer.done;
    // return true;
  }

  // Returns a reference to the answer list with the indicated ID. Returns
  // `undefined`. if not found. Note that `questionId` must be numeric.
  // _findQuestion(questionId) {
  //   // return this._questions.find(question => question.id === questionId);
  // }

  // Returns a reference to the indicated answer in the indicated answer list.
  // Returns `undefined` if either the answer list or the answer is not found. Note
  // that both IDs must be numeric.
  // _findAnswer(questionId, answerId) {
  // //   let question = this._findQuestion(questionId);
  // //   if (!question) return undefined;

  // //   return question.answers.find(answer => answer.id === answerId);
  // }
};
