const nextId = require("./next-id");
const Answer = require("./answer");

class Question {
  constructor(title) {
    this.id = nextId();
    this.title = title;
    this.answers = [];
  }

  static makeQuestion(rawQuestion) {
    let question = Object.assign(new Question(), {
      id: rawQuestion.id,
      title: rawQuestion.title,
    });

    rawQuestion.answers.forEach(answer => question.add(Answer.makeAnswer(answer)));
    return question;
  }

  add(answer) {
    if (!(answer instanceof Answer)) {
      throw new TypeError("can only add Answer objects");
    }

    this.answers.push(answer);
  }

  size() {
    return this.answers.length;
  }

  first() {
    return this.answers[0];
  }

  last() {
    return this.answers[this.size() - 1];
  }

  answerAt(index) {
    this._validateIndex(index);
    return this.answer[index];
  }

  markDoneAt(index) {
    this.answerAt(index).markDone();
  }

  markUndoneAt(index) {
    this.answerAt(index).markUndone();
  }

  isDone() {
    return this.size() > 0 && this.answers.every(answer => answer.isDone());
  }

  shift() {
    return this.answers.shift();
  }

  pop() {
    return this.answers.pop();
  }

  removeAt(index) {
    this._validateIndex(index);
    return this.answers.splice(index, 1);
  }

  toString() {
    let title = `---- ${this.title} ----`;
    let list = this.answers.map(answer => answer.toString()).join("\n");
    return `${title}\n${list}`;
  }

  forEach(callback) {
    this.answers.forEach(answer => callback(answer));
  }

  filter(callback) {
    let newList = new Question(this.title);
    this.forEach(answer => {
      if (callback(answer)) {
        newList.add(answer);
      }
    });

    return newList;
  }

  findByTitle(title) {
    return this.filter(answer => answer.title === title).first();
  }

  findById(id) {
    return this.filter(answer => answer.id === id).first();
  }
  
  findIndexOf(answerToFind) {
    let findId = answerToFind.id;
    return this.answers.findIndex(answer => answer.id === findId);
  }

  allDone() {
    return this.filter(answer => answer.isDone());
  }

  allNotDone() {
    return this.filter(answer => !answer.isDone());
  }

  allAnswers() {
    return this.filter(_ => true);
  }

  markDone(title) {
    let answer = this.findByTitle(title);
    if (answer !== undefined) {
      answer.markDone();
    }
  }

  markAllDone() {
    this.forEach(answer => answer.markDone());
  }

  markAllUndone() {
    this.forEach(answer => answer.markUndone());
  }

  toArray() {
    return this.answers.slice();
  }

  setTitle(title) {
    this.title = title;
  }

  _validateIndex(index) { // _ in name indicates "private" method
    if (!(index in this.answers)) {
      throw new ReferenceError(`invalid index: ${index}`);
    }
  }
}

module.exports = Question;