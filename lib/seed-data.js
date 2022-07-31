const nextId = require("./next-id");

module.exports = [
  {
    id: nextId(),
    title: "favorite color",
    answers: [
      {
        id: nextId(),
        title: "red",
        done: false,
      },
      {
        id: nextId(),
        title: "blue",
        done: false,
      },
      {
        id: nextId(),
        title: "green",
        done: false,
      },
    ],
  },
  {
    id: nextId(),
    title: "favorite sport",
    answers: [
      {
        id: nextId(),
        title: "Baseball",
        done: false,
      },
      {
        id: nextId(),
        title: "Basketball",
        done: false,
      },
      {
        id: nextId(),
        title: "Tennis",
        done: false,
      },
      {
        id: nextId(),
        title: "Hockey",
        done: false,
      },
    ],
  },
  {
    id: nextId(),
    title: "Additional question",
    answers: [],
  },
  {
    id: nextId(),
    title: "favorite person",
    answers: [
      {
        id: nextId(),
        title: "my dad",
        done: false,
      },
    ],
  },
];