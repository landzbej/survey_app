// Compare todo list titles alphabetically
const compareByTitle = (answerA, answerB) => {
  let titleA = answerA.title.toLowerCase();
  let titleB = answerB.title.toLowerCase();

  if (titleA < titleB) {
    return -1;
  } else if (titleA > titleB) {
    return 1;
  } else {
    return 0;
  }
};

const sortItems = (undone, done) => {
  undone.sort(compareByTitle);
  done.sort(compareByTitle);
  return [].concat(undone, done);
};

module.exports = {
// return the list of todo lists sorted by completion status and title.
//   sortQuestions (questions) {
//   let undone = questions.filter(question => !question.isDone());
//   let done   = questions.filter(question => question.isDone());
//   undone.sort(compareByTitle);
//   done.sort(compareByTitle);
//   return [].concat(undone, done);
// },

// sortQuestions(undone, done) {
//   undone.sort(compareByTitle);
//   done.sort(compareByTitle);
//   return [].concat(undone, done);
// },

// sortAnswers (question) {
//   let undone = question.answers.filter(answer => !answer.isDone());
//   let done   = question.answers.filter(answer => answer.isDone());
//   undone.sort(compareByTitle);
//   done.sort(compareByTitle);
//   return [].concat(undone, done);
// },

sortQuestions: sortItems,
sortAnswers: sortItems,
};