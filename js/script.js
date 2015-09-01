(function() {
    var app = angular.module('fitners', []);

    app.config(function ($locationProvider) {
        $locationProvider.html5Mode(true);
    });

    app.controller('SearchController', function($scope){
        var controller = this;
        controller.results = [];
        controller.searching = false;
        controller.noresult = false;
        controller.gym = "";

        var db = new Firebase('https://fitners.firebaseio.com/coaches/');

        controller.search = function() {
            controller.results = [];
            controller.searching = true;
            controller.noresult = false;

            db.orderByChild('gym').equalTo(controller.gym).limitToFirst(10).once('value', function(snapshot) {
                if(snapshot.val() === null) {
                    controller.searching = false;
                    controller.noresult = true;
                    return;
                }

                controller.searching = false;

                // TODO: sort by number of stars

                snapshot.forEach(function(data) {
                    var value = data.val();
                    value.id = data.key();

                    controller.results.push(value);
                });

                $scope.$apply();
            });

            return false;
        }

        controller.showComments = function(coach) {
            controller.showModal = 'comments';
            controller.selectedCoach = coach;
        }

        controller.submitComment = function() {
            controller.showModal = false;
            console.log('Submitting new comment', controller.comment, controller.stars);

            db.child(controller.selectedCoach.id +'/ratings').push().set({
                 comment: controller.comment,
                 name: 'anonymous',
                 stars: parseInt(controller.stars)
            });

            controller.comment = undefined;
            controller.stars = undefined;
        }
    });

    app.directive('ngModal', function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                scope.$watch(attrs.ngModal, function(value) {
                    if (value) element.modal('show');
                    else element.modal('hide');
                });
            }
        };
    });
})();
