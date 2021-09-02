const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");
// const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

mongoose.connect("mongodb+srv://admin-vivek:mongo123@cluster0.ujrs8.mongodb.net/todolistDB")
// mongoose.connect("mongodb://localhost:27017/todolistDB"); //database

const itemsSchema = new mongoose.Schema({
  name: String
}); // schema

const Item = mongoose.model(
  "Item", itemsSchema
); // model

// Add a few dummy data
const item1 = new Item({
  name: "Welcome to your todo list!"
});

const item2 = new Item({
  name: "Hit + to add a new item."
});

const item3 = new Item({
  name: "Hit chechbox to delete an item."
});

// insert default items to database
const defaultItems = [item1, item2, item3]

// for custome list
const listSchema = {
  name: String,
  items: [itemsSchema]
};

// model for custom list
const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  // const day = date.getDate();

  // read items in database
  Item.find({}, function(err, foundItems) {
    // console.log(foundItems);

    // if no items in collection, add default else show items
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to database!")
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today", // day
        newListItems: foundItems //items
      });
    }
  });
});

// Express routing parameter
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  // console.log(customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) { // console.log("Doesn't exist!");

        // create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);

      } else { // console.log("Exists!");

        // show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });

  // app.get("/work", function(req, res) {
  //   res.render("list", {
  //     listTitle: "Work List",
  //     newListItems: workItems
  //   });
  // });
});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {

    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});


app.post("/delete", function(req, res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove({
      _id: checkedItemId
    }, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});


app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
