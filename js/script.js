if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (obj, fromIndex) {
        if (fromIndex == null) {
            fromIndex = 0;
        } else if (fromIndex < 0) {
            fromIndex = Math.max(0, this.length + fromIndex);
        }
        for (var i = fromIndex, j = this.length; i < j; i++) {
            if (this[i] === obj)
                return i;
        }
        return -1;
    };
}

(function() {
    var app = angular.module('fitners', ['ui.bootstrap']);

    app.config(function ($locationProvider) {
        $locationProvider.html5Mode(true);
    });

    app.controller('SearchController', function($scope){
        var controller = this;
        controller.results = [];
        controller.searching = false;
        controller.noresult = false;
        controller.gym = '';
        controller.area = '';
        controller.goalVolume = false;
        controller.goalDefinition = false;
        controller.gyms = window.gyms;
        controller.areas = ['Eixample', 'Ciutat Vella', 'Gràcia', 'Sant Martí', 'Sarrià-Sant Gervasi', 'Les Corts', 'Sants-Montjuïc', 'Horta-Guinardó', 'Sant Andreu', 'Nou Barris'];
        controller.searchcriteria = 'gym';
        controller.foldGoal = true;

        var db = new Firebase('https://fitners.firebaseio.com/coaches/');

        controller.search = function() {
            controller.results = [];
            controller.searching = true;
            controller.noresult = false;

            if (controller.searchcriteria == 'gym') {
                controller.searchGym();
            } else if (controller.searchcriteria == 'area') {
                controller.searchArea();
            } else {
                throw 'wrong search criteria';
            }
        }

        controller.searchGym = function() {
            var gymid = '';
            for (var i = 0; i < controller.gyms.length; i++) {
                if (controller.gyms[i].name == controller.gym) {
                    gymid = controller.gyms[i].id;
                    break;
                }
            }

            db.orderByChild('gym').equalTo(gymid).once('value', showResults);

            return false;
        }

        controller.searchArea = function() {
            db.orderByChild('area').equalTo(controller.area).limitToFirst(10).once('value', showResults);

            return false;
        }

        function showResults(snapshot) {
            if(snapshot.val() === null) {
                controller.searching = false;
                controller.noresult = true;
                $scope.$apply();
                return;
            }

            controller.searching = false;

            // TODO: sort by number of stars

            snapshot.forEach(function(data) {
                var value = data.val();
                value.id = data.key();

                if(controller.goalVolume && value.goals.indexOf(1) == -1) {
                    return;
                }
                if(controller.goalDefinition && value.goals.indexOf(2) == -1) {
                    return;
                }

                controller.results.push(value);
            });

            $scope.$apply();
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

        // controller.gym = '-Jy8WJqcvr0D7a-ECxQE';
        // controller.searchGym();
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

    app.filter('goals',[ function () {
        return function(items) {
            var str = '';
            for (i = 0; i < items.length; i++) {
                if (i > 0) {
                    str += ', ';
                }
                if (items[i] == 1) {
                    str += 'Volumen';
                }
                if (items[i] == 2) {
                    str += 'Definición';
                }
            }
            return str;
        };
    }]);
})();
