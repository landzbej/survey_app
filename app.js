const config = require("./lib/config");
const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
const Question = require("./lib/question");
// const Answer = require("./lib/answer");
// const { sortAnswers } = require("./lib/sort");
const store = require("connect-loki");
const SeedData = require("./lib/seed-data"); // Temporary code!
const PgPersistence = require("./lib/pg-persistence");
const catchError = require("./lib/catch-error");

const app = express();
const host = config.HOST;
const port = config.PORT;
const LokiStore = store(session);



// const loadQuestion = (questionId, questions) => {
//   // console.log(questions.find(question => question.id === questionId));
//   return questions.find(question => question.id === questionId);
// };

const loadAnswer = (questionId, answerId, questions) => {
  let question = loadQuestion(questionId, questions);
  if (!question) return undefined;

  return question.answers.find(answer => answer.id === answerId);
};

const requiresAuthentication = (req, res, next) => {
  if (!res.locals.signedIn) {
    res.redirect(302, "/users/signin")
  } else {
    next();
  }
}

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in millseconds
    path: "/",
    secure: false,
  },
  name: "launch-school-todos-session-id",
  resave: false,
  saveUninitialized: true,
  secret: config.SECRET,
  store: new LokiStore({}),
}));

app.use(flash());
// // Set up persistent session data
// app.use((req, res, next) => {
//   req.session.questions = SeedData; // Temporary code!
//   let questions = [];
//   // console.log(req.session.questions);
//   if ("questions" in req.session) {
//     req.session.questions.forEach(question => {
//       questions.push(Question.makeQuestion(question));
//     });
//   }

//   req.session.questions = questions;
//   console.log(req.session.questions);
//   next();
// });

app.use((req, res, next) => {
  res.locals.username = req.session.username;
  res.locals.signedIn = req.session.signedIn;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// Create a new datastore
app.use((req, res, next) => {
  res.locals.store = new PgPersistence(req.session);
  next();
});

// Temporary test code
// app.use(async(req, res, next) => {
//   try {
//   await res.locals.store.testQuery1();
//   await res.locals.store.testQuery2();
//   await res.locals.store.testQuery3('red');
//   await res.locals.store.testQuery3('blue');
//   const maliciousCode = "'; UPDATE todos SET done = true WHERE done <> 't";
//   await res.locals.store.testQuery3(maliciousCode);
//   res.send("quitting");
//   } catch (error) {
//     next(error);
//   }
// });

app.get("/", (req, res) => {
  res.redirect("/lists");
});

app.get("/users/signin", (req, res) => {
  req.flash("info", "Please sign in.");
  res.render("signin", {
    flash: req.flash(),
  });
  
})

app.post("/users/signout", (req, res) => {
  delete req.session.username;
  delete req.session.signedIn;
  res.redirect("/users/signin");
})

app.post("/users/signin", catchError(async (req, res) => {
  let username = req.body.username.trim();
  let password = req.body.password;

  let authenticated = await res.locals.store.authenticate(username, password);

  if (!authenticated){
    req.flash("error", "Invalid credentials.");
    res.render("signin", {
      flash: req.flash(),
      username: req.body.username,
    })
  } else {
    req.session.username = username;
    req.session.signedIn = true;
    req.flash("info", "Welcome!");
    res.redirect("/lists")
  }
}
))

app.get("/lists/new", (req, res) => {
  requiresAuthentication,
  res.render("new-list");
});

app.get("/lists", 
  requiresAuthentication,
  catchError(async (req, res) => {
  let store = res.locals.store;
  let questions = await store.sortedQuestions();

  let answersInfo = questions.map(question => ({
    countAllAnswers: question.answers.length,
    countDoneAnswers: question.answers.filter(answer => answer.done).length,
    isDone: store.isDoneQuestion(question),
  }));

  res.render("lists", {
    questions,
    answersInfo,
  });
}) 
);

app.post("/lists",
requiresAuthentication,
  [
    body("questionTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The list title is required.")
      .isLength({ max: 100 })
      .withMessage("List title must be between 1 and 100 characters.")
  ],
  catchError(async (req, res) => {
    let questionTitle = req.body.questionTitle;
    let errors = validationResult(req);
    const rerenderNewList = () => {
        res.render("new-list", {
          flash: req.flash(),
          questionTitle,
        });
    }
      
      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));

        rerenderNewList();
      } else if (await res.locals.store.existsQuestionTitle(questionTitle)) {
        req.flash("error", "the list title must be unique.");
        rerenderNewList();
        } else {
          let created = await res.locals.store.createQuestion(questionTitle);
          if (!created) {
            req.flash("error", "Failed to create todo list.");
            rerenderNewList;
          } else {
        req.flash("success", "Question updated.");
        res.redirect(`/lists`);
          }
          }
      }

));


// Render individual todo list and its todos
app.get("/lists/:questionId", 
requiresAuthentication,
catchError(async(req, res, next) => {
  let questionId = req.params.questionId;
  let question = await res.locals.store.loadQuestion(+questionId);
  // console.log(question);
  // console.log(sortAnswers(question));
  if (question === undefined) {
    next(new Error("Not found."));
  } else {
    question.answers = await res.locals.store.sortedAnswers(question);
    res.render("list", {
      question,
      isDoneQuestion: res.locals.store.isDoneQuestion(question),
      hasUndoneAnswers: res.locals.store.hasUndoneAnswers(question),
    });
  }
}) 
);

app.post("/lists/:questionId/answers/:answerId/toggle", 
requiresAuthentication,
catchError(async (req, res) => {
  let { questionId, answerId } = { ...req.params };
  let toggled = await res.locals.store.toggleDoneAnswer(+questionId, +answerId);
  if (!toggled)
    throw (new Error("Not found."));
    let answer = await res.locals.store.loadAnswer(+questionId, +answerId);
    if (answer.done) {
      req.flash("success", `"${answer.title}" marked done.`);
    } else {
      req.flash("success", `"${answer.title}" marked as NOT done!`);
    }

    res.redirect(`/lists/${questionId}`);
  }
)
);

// Delete a todo
app.post("/lists/:questionId/answers/:answerId/destroy", 
requiresAuthentication,
catchError(async (req, res, next) => {
  let { questionId, answerId } = { ...req.params };

  let deleted = await res.locals.store.deleteAnswer(+questionId, +answerId)
  if (!deleted) throw new Error("Not found.");
      req.flash("success", "The answer has been deleted.");
      res.redirect(`/lists/${questionId}`);
}
));

// Mark all todos as done
app.post("/lists/:questionId/complete_all", 
requiresAuthentication,
catchError(async (req, res) => {
  let questionId = req.params.questionId;
  let completed = await res.locals.store.completeAllAnswers(+questionId);
  if (!completed) throw new Error("Not found.");
  req.flash("success", "All answers have been marked as done.");
  res.redirect(`/lists/${questionId}`);
  }
));

// Add this code just before the error handler

// Create a new todo and add it to the specified list
app.post("/lists/:questionId/answers",
requiresAuthentication,
  [
    body("answerTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The answer title is required.")
      .isLength({ max: 100 })
      .withMessage("Answer title must be between 1 and 100 characters."),
  ],
  catchError(async (req, res) => {
    let questionId = req.params.questionId;
    let question = await res.locals.store.loadQuestion(+questionId);
    let answerTitle = req.body.answerTitle;
    if (!question) throw new Error("Not found.");
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));

        question.answers = await res.locals.store.sortedAnswers(question)
        res.render("list", {
          flash: req.flash(),
          question: question,
          isDoneQuestion: await res.locals.store.isDoneQuestion(question),
          hasUndoneAnswers: await res.locals.store.hasUndoneAnswers(question),
          answerTitle,
        });
      } else {
        let created = await res.locals.store.createAnswer(+questionId, answerTitle);
        if(!created) throw new Error("Not found.");
        req.flash("success", "The answer has been created.");
        res.redirect(`/lists/${questionId}`);
        }
      }
));

// Render edit todo list form
app.get("/lists/:questionId/edit", 
requiresAuthentication,
catchError(async (req, res) => {
  let questionId = req.params.questionId;
  let question = await res.locals.store.loadQuestion(+questionId);
  if (!question) throw new Error("Not found.");
    res.render("edit-list", { question });
  }
));

// Delete todo list
app.post("/lists/:questionId/destroy", 
requiresAuthentication,
catchError(async (req, res, next) => {
  let questionId = req.params.questionId;
  let deleted = res.locals.store.deleteQuestion(+questionId);
  if (!deleted) throw new Error("Not found.");
    req.flash("success", "Question deleted.");
    res.redirect("/lists");
}
));

// Edit todo list title
app.post("/lists/:questionId/edit",
requiresAuthentication,
  [
    body("questionTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The question title is required.")
      .isLength({ max: 100 })
      .withMessage("Question title must be between 1 and 100 characters.")
  ],
  catchError(async (req, res) => {
    let store = res.locals.store;
    let questionId = req.params.questionId;
    let questionTitle = req.body.questionTitle;

    const rerenderEditList = async () => {
      let question = await store.loadQuestion(+questionId);
      if (!question) throw new Error("Not found.");
        res.render("edit-list", {
          flash: req.flash(),
          questionTitle,
          question,
        });
      }
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));

        await rerenderEditList();
      } else if (await store.existsQuestionTitle(questionTitle)) {
        req.flash("error", "the list title must be unique.");
        await rerenderEditList();
      } else {
        let updated = await store.setQuestionTitle(+questionId, questionTitle)
        if (!updated) throw new Error("Not found.");
        
        req.flash("success", "Question updated.");
        res.redirect(`/lists/${questionId}`);
      }
    }));

app.use((err, req, res, _next) => {
  console.log(err);
  res.status(404).send(err.message);
});


// Listener
app.listen(port, host, () => {
  console.log(`Budget is listening on port ${port} of ${host}!`);
});