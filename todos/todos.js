/* Database Collections */
Todos = new Mongo.Collection('todo');

Lists = new Mongo.Collection(('lists'))

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
    name: 'listPage',
    data: function () {
        var currentList = this.params._id;
        var currentUser = Meteor.userId();
        return Lists.findOne({_id: currentList, createdBy: currentUser});
    },
    onRun: function () {
        this.next();

        console.log("You triggered the onRun function for listPage route");
    },

    onRerun: function () {
        console.log("You triggered the on Rerun function for listPage route");
    },
    onBeforeAction: function () {
        // On before action is a hook that allows us to plug into route before executing the route
        var currentUser = Meteor.userId();
        if(currentUser){
            // User logged in
            this.next(); // Do what you would normally do.

        } else {
            // User (NOT) logged in
            this.render('login'); //send to login page

        }
    },

    onAfterAction: function () {
        console.log("You triggered the onAfterAction function for listPage route");
    },
    onStop: function () {
        console.log("You triggered the onStop function for listPage route");
    }

});


if (Meteor.isClient) {
    //Custome default rules for Jquery validate plugin.
    $.validator.setDefaults({
        rules: {

            email: {
                required: true,
                email: true
            },
            password: {
                required: true,
                minlength: 6
            }
        },
        messages: {
            email: {
                required: 'Email address is required',
                email: 'Please enter a valid email address'
            },
            password: {
                required: 'Password is required',
                minlength: 'Password must contain 6 characters or more.'
            }
        }
    });

    Template.login.onCreated(function () {
       console.log("Login template onCreate function triggered.");
    });

    Template.login.onRendered(function () {
        var validator = $('.login').validate({
            submitHandler: function (event) {
                var email = $('[name="email"]').val();
                var password = $('[name="password"]').val();

                Meteor.loginWithPassword(email, password, function (error) {
                    if(error) {
                        if (error) {
                            if (error.reason == "User not found") {
                                validator.showErrors({
                                    email: 'That email doesn\'t belong to a registred user'
                                });
                            }
                            if (error.reason == "Incorrect password") {
                                validator.showErrors({
                                    password: error.reason
                                });
                            }
                        } else {
                            var currentRoute = Router.current().route.getName();
                            if (currentRoute == 'login') {
                                Router.go('home');
                            }
                        }
                    }

                });
            },
        });

    });

    Template.register.onRendered(function (){
        $('.register').validate({
            submitHandler: function (event) {
                var email = $('[name="email"]').val();
                var password = $('[name="password"]').val();
                Accounts.createUser({
                    email: email,
                    password: password
                }, function (error) {
                    if (error) {
                        if (error.reason == "Email alredy exists") {
                            validator.showErrors({
                                email: "That email already belongs to a registered user."
                            });
                        }
                        if (error.reason == "Incorrect password") {
                            validator.showErrors({
                                password: error.reason
                            });
                        }
                    } else {
                        Router.go('home'); // If no error with registration redirect logged in user to home page
                    }
                });
                Router.go('home');
            }
        });
    });

    Template.login.onDestroyed(function () {
        console.log("Login template onDestroyed function triggered.");
    });
    /* HELPERS */

    Template.lists.helpers({
        'list' : function () {
            var currentUser = Meteor.userId();
            return Lists.find({ createdBy: currentUser }, {sort : { name: 1 }});
        },
    });

    Template.todos.helpers({
        'todo': function () {
            var currentId = this._id;
            var currentUser = Meteor.userId();
            return Todos.find({ listId: currentId, createdBy: currentUser }, {sort: {createdAt: -1}});
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
           var currentId = this._id;
           return Todos.find({ listID: currentId,  completed: true }).count();
       },

       'totaltodos': function () {
           // Calculate total number of todos
           var currentId = this._id;
           return Todos.find({ listId: currentId }).count();
       }

    });

    /* EVENTS */
    Template.navigation.events({
        'click .logout': function (event) {
            event.preventDefault();
            Meteor.logout();
            Router.go('login');
        }
    });

    Template.login.events({
       'submit form': function (event) {
           event.preventDefault();

       }
    });

    Template.register.events({
       'submit form': function(event){
          event.preventDefault();

       },

    });

    Template.addList.events({
        'submit form': function (event) {
            event.preventDefault();
            var listText = $('[name="listName"]').val();
            var currentUser = Meteor.userId();
            Lists.insert({
               name: listText,
                createdBy: currentUser
            }, function (error, results){
                   Router.go('listPage', { _id: results }); // Go to newly created list

            });
            $('[name="listName"]').val('');
        }
    });

    Template.addTodo.events({
        'submit form': function (event) {
            event.preventDefault();
            var currentUser = Meteor.userId(); // get current user id
            var todoText = $('[name="todoName"]').val(); // get the task entered into the form.
            var currentList = this._id;
            Todos.insert({
                name: todoText,
                completed: false,
                createdAt: Date(),
                listId: currentList,
                createdBy: currentUser
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

