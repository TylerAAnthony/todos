/* Routes */
Router.configure({
    // Specify Header and footer template route
   layoutTemplate: 'main',
});

// Register Route
Router.route('/register', {
    name: 'register'
});

// Login Route
Router.route('/login', {
    name: 'login'
});

// Home Route
Router.route('/', {
    name: 'home',
    template: 'home',
});

// List Route
Router.route('/list/:_id', {
    template: 'listPage',
    data: function () {
        var currentList = this.params._id;
        return Lists.findOne({ _id: currentList });
    }

});


/* Database Collections */
Todos = new Mongo.Collection('todo');

Lists = new Mongo.Collection(('lists'))



if (Meteor.isClient) {
    /* HELPERS */

    Template.lists.helpers({
        'list' : function () {
            return Lists.find({}, {sort : { name: 1 }});
        },
    });

    Template.todos.helpers({
        'todo': function () {
            var currentId = this._id;
            return Todos.find({ listId: currentId }, {sort: {createdAt: -1}});
        },
    });

    Template.todoItem.helpers({
       'checked': function() {
           var isCompleted = this.completed;
           if(isCompleted){
               return "checked";
           }else{
               return "";
           }
       }
    });

    Template.todosCount.helpers({
       'completedTodos': function() {
           // Calculate number of completed todos
           return Todos.find({ completed: true }).count();
       },

       'totaltodos': function () {
           // Calculate total number of todos
           return Todos.find().count();
       }

    });

    /* EVENTS */

    Template.addList.events({
        'submit form': function (event) {
            event.preventDefault();
            var listText = $('[name="listName"]').val();
            Lists.insert({
               name: listText
            });
            $('[name="listName"]').val('');
        }
    });

    Template.addTodo.events({
        'submit form': function (event) {
            event.preventDefault();
            var todoText = $('[name="todoName"]').val();
            var currentList = this._id;
            Todos.insert({
                name: todoText,
                completed: false,
                createdAt: Date(),
                listId: currentList
            });

            $('[name="todoName"]').val('');
        },
    });

    Template.todoItem.events({
        'click .delete-todo': function (event) {
            event.preventDefault();
            var documentId = this._id;
            var confirm = window.confirm("Continue Delete Task?");
            if (confirm) {
                Todos.remove({_id: documentId});
            }
        },
        //Update database when task edited from within interface.
        'keyup [name=todoItem]': function (event) {
            event.preventDefault();
            var documentId = this._id;
            var todoText = $(event.target).val(); // Get text from input field
            Todos.update({ _id: documentId }, {$set: { name: todoText}});
        },

        'change [type=checkbox]': function(){
          event.preventDefault();
          var documentId = this._id;
          var isCompleted = this.completed;
          if(isCompleted) {

              Todos.update({ _id: documentId }, { $set: { completed: false }});
              console.log("You unchecked a task.");

          }else{

              Todos.update({ _id: documentId }, { $set: { completed: true }});
              console.log("Task completed good job!");

          }

        },

    });
}

    if (Meteor.isServer) {

}

