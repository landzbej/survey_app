const nextId = require("./next-id");

class Answer {
  constructor(title) {
    this.id = nextId();
    this.title = title;
    this.done = false;
  }

  static makeAnswer(rawAnswer) {
    return Object.assign(new Answer(), rawAnswer);
  }

  toString() {
    let marker = this.isDone() ? Answer.DONE_MARKER : Answer.UNDONE_MARKER;
    return `[${marker}] ${this.title}`;
  }

  markDone() {
    this.done = true;
  }

  markUndone() {
    this.done = false;
  }

  isDone() {
    return this.done;
  }

  setTitle(title) {
    this.title = title;
  }
}

Answer.DONE_MARKER = "X";
Answer.UNDONE_MARKER = " ";

module.exports = Answer;