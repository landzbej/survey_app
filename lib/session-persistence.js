const SeedData = require("./seed-data");
const deepCopy = require("./deep-copy");
const { sortQuestions, sortAnswers } = require("./sort");
const nextId = require("./next-id");

module.exports = class SessionPersistence {
  constructor(session) {
    this._questions = session.questions || deepCopy(SeedData);
    session.questions = this._questions;
  }

  // Mark all answers on the answer list as done. Returns `true` on success,
  // `false` if the answer list doesn't exist. The answer list ID must be numeric.
  completeAllAnswers(questionId) {
    let question = this._findQuestion(questionId);
    if (!question) return false;

    question.answers.filter(answer => !answer.done)
                  .forEach(answer => (answer.done = true));
    return true;
  }

  // Create a new answer with the specified title and add it to the indicated answer
  // list. Returns `true` on success, `false` on failure.
  createAnswer(questionId, title) {
    let question = this._findQuestion(questionId);
    if (!question) return false;

    question.answers.push({
      title,
      id: nextId(),
      done: false,
    });

    return true;
  }

  // Create a new answer list with the specified title and add it to the list of
  // answer lists. Returns `true` on success, `false` on failure. (At this time,
  // there are no known failure conditions.)
  createQuestion(title) {
    this._questions.push({
      title,
      id: nextId(),
      answers: [],
    });

    return true;
  }

  // Delete the specified answer from the specified answer list. Returns `true` on
  // success, `false` if the answer or answer list doesn't exist. The id arguments
  // must both be numeric.
  deleteAnswer(questionId, answerId) {
    let question = this._findQuestion(questionId);
    if (!question) return false;

    let answerIndex = question.answers.findIndex(answer => answer.id === answerId);
    if (answerIndex === -1) return false;

    question.answers.splice(answerIndex, 1);
    return true;
  }

  // Delete a answer list from the list of answer lists. Returns `true` on success,
  // `false` if the answer list doesn't exist. The ID argument must be numeric.
  deleteQuestion(questionId) {
    let questionIndex = this._questions.findIndex(question => {
      return question.id === questionId;
    });

    if (questionIndex === -1) return false;

    this._questions.splice(questionIndex, 1);
    return true;
  }

  // Returns `true` if a answer list with the specified title exists in the list
  // of answer lists, `false` otherwise.
  existsQuestionTitle(title) {
    return this._questions.some(question => question.title === title);
  }

  // Does the answer list have any undone answers? Returns true if yes, false if no.
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
  loadAnswer(questionId, answerId) {
    let answer = this._findAnswer(questionId, answerId);
    return deepCopy(answer);
  }

  // Returns a copy of the answer list with the indicated ID. Returns `undefined`
  // if not found. Note that `questionId` must be numeric.
  loadQuestion(questionId) {
    let question = this._findQuestion(questionId);
    return deepCopy(question);
  }

  // Set a new title for the specified answer list. Returns `true` on success,
  // `false` if the answer list isn't found. The answer list ID must be numeric.
  setQuestionTitle(questionId, title) {
    let question = this._findQuestion(questionId);
    if (!question) return false;

    question.title = title;
    return true;
  }

  // Return the list of answer lists sorted by completion status and title (case-
  // insensitive).
  sortedQuestions() {
    let questions = deepCopy(this._questions);
    let undone = questions.filter(question => !this.isDoneQuestion(question));
    let done = questions.filter(question => this.isDoneQuestion(question));
    return sortQuestions(undone, done);
  }

  // Returns a copy of the list of answers in the indicated answer list by sorted by
  // completion status and title (case-insensitive).
  sortedAnswers(question) {
    let answers = question.answers;
    let undone = answers.filter(answer => !answer.done);
    let done = answers.filter(answer => answer.done);
    return deepCopy(sortAnswers(undone, done));
  }

  // Toggle a answer between the done and not done state. Returns `true` on
  // success, `false` if the answer or answer list doesn't exist. The id arguments
  // must both be numeric.
  toggleDoneAnswer(questionId, answerId) {
    let answer = this._findAnswer(questionId, answerId);
    if (!answer) return false;

    answer.done = !answer.done;
    return true;
  }

  // Returns a reference to the answer list with the indicated ID. Returns
  // `undefined`. if not found. Note that `questionId` must be numeric.
  _findQuestion(questionId) {
    return this._questions.find(question => question.id === questionId);
  }

  // Returns a reference to the indicated answer in the indicated answer list.
  // Returns `undefined` if either the answer list or the answer is not found. Note
  // that both IDs must be numeric.
  _findAnswer(questionId, answerId) {
    let question = this._findQuestion(questionId);
    if (!question) return undefined;

    return question.answers.find(answer => answer.id === answerId);
  }
};
