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
    var app = angular.module('fitners', ['ui.bootstrap','ui.slider']);

    app.config(function ($locationProvider) {
        $locationProvider.html5Mode(true);
    });

    app.controller('SearchController', function($scope, $modal){
        var controller = this;
        controller.results = [];
        controller.searching = false;
        controller.gym = '';
        controller.area = '';
        controller.goalVolume = false;
        controller.goalDefinition = false;
        controller.goalWeight = false;
        controller.goalNutrition = false;
        controller.gyms = window.gyms;
        controller.areas = ['Eixample', 'Ciutat Vella', 'Gràcia', 'Sant Martí', 'Sarrià-Sant Gervasi', 'Les Corts', 'Sants-Montjuïc', 'Horta-Guinardó', 'Sant Andreu', 'Nou Barris'];
        controller.searchcriteria = 'gym';
        controller.showGoal = false;
        controller.showPrice = false;
        controller.showQualifications = false;
        controller.pricerange = [20,60];

        var loginData;

        $scope.numFullStars = function(n) {
            Math.round(n);
            n = n / 2;
            return new Array(Math.floor(n));
        };

        $scope.isHalfStar = function(n) {
            return n % 2;
        };

        $scope.numEmptyStars = function(n) {
            Math.round(n);
            var n2 = n / 2;
            n2 = 5 - Math.floor(n2) - ($scope.isHalfStar(n) ? 1 : 0);
            return new Array(n2);
        };

        $scope.keys = Object.keys;

        var db = new Firebase('https://fitners.firebaseio.com/coaches/');

        controller.search = function() {
            controller.results = [];
            controller.searching = true;

            if (controller.searchcriteria == 'gym') {
                controller.searchGym();
            } else if (controller.searchcriteria == 'area') {
                controller.searchArea();
            } else {
                throw 'wrong search criteria';
            }
        }

        controller.searchAll = function() {
            controller.results = [];
            controller.searching = true;
            db.once('value', showResults);

            return false;
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
            db.orderByChild('area').equalTo(controller.area).once('value', showResults);

            return false;
        }

        function showResults(snapshot) {
            if(snapshot.val() === null) {
                controller.searching = false;
                $scope.$apply();
                return;
            }

            controller.searching = false;

            // TODO: sort by something

            snapshot.forEach(function(data) {
                var value = data.val();
                value.id = data.key();

                if (controller.showGoal) {
                    if (controller.goalVolume && value.goals.indexOf(1) == -1) {
                        return;
                    }
                    if (controller.goalDefinition && value.goals.indexOf(2) == -1) {
                        return;
                    }
                    if (controller.goalWeight && value.goals.indexOf(3) == -1) {
                        return;
                    }
                    if (controller.goalDiet && value.goals.indexOf(4) == -1) {
                        return;
                    }
                }

                if (controller.showPrice) {
                    if (value.wage < controller.pricerange[0] || value.wage > controller.pricerange[1]) {
                        return;
                    }
                }

                controller.results.push(value);
            });

            $scope.$apply();
        }

        controller.showComments = function(coach) {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'comments.html',
                controller: 'CommentsModalController',
                controllerAs: 'commentsCtrl',
                resolve: {
                    coach: function () {
                        return coach;
                    }
                }
            });
        }

        controller.showPhone = function(coach) {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'phone.html',
                controller: 'PhoneModalController',
                controllerAs: 'phoneCtrl',
                resolve: {
                    telephone: function () {
                        return coach.telephone;
                    }
                }
            });
        }

        controller.searchAll();
    });

    app.controller('CommentsModalController', function($scope, $modalInstance, $modal, coach) {
        var controller = this;

        controller.coach = coach;
        controller.ratings = ['knowledge', 'compatibility', 'results', 'punctuality', 'pricequality'];

        controller.showWrite = function() {
            db = new Firebase("https://fitners.firebaseio.com/coaches");
            db.authWithOAuthPopup("facebook", function(error, authData) {
                if (error) {
                    console.log("Login Failed!", error);
                } else {
                    console.log("Authenticated successfully with payload:", authData);

                    $modalInstance.close();

                    var modalInstance = $modal.open({
                        animation: true,
                        templateUrl: 'writecomment.html',
                        controller: 'WriteModalController',
                        controllerAs: 'writeCtrl',
                        resolve: {
                            coach: function () {
                                return coach;
                            },
                            loginData: function () {
                                return authData;
                            }
                        }
                    });
                }
            });
        };

        controller.close = function () {
            $modalInstance.close();
        };

        $scope.numFullStars = function(n) {
            Math.round(n);
            n = n / 2;
            return new Array(Math.floor(n));
        };

        $scope.isHalfStar = function(n) {
            return n % 2;
        };

        $scope.numEmptyStars = function(n) {
            Math.round(n);
            var n2 = n / 2;
            n2 = 5 - Math.floor(n2) - ($scope.isHalfStar(n) ? 1 : 0);
            return new Array(n2);
        };
    });

    app.controller('WriteModalController', function($modalInstance, coach, loginData) {
        var controller = this;

        controller.coach = coach;

        controller.goals = ['Otro', 'Volumen', 'Definición', 'Perder peso', 'Nutrición'];
        controller.commentGoals = [
            {text: "Volumen", value: 1},
            {text: "Definición", value: 2},
            {text: "Adelgazar", value: 3},
            {text: "Otro", value: 0}
        ];
        controller.commentGoal = 0;
        controller.grades = [
            {text: "0", value: 0},
            {text: "1", value: 1},
            {text: "2", value: 2},
            {text: "3", value: 3},
            {text: "4", value: 4},
            {text: "5", value: 5},
            {text: "6", value: 6},
            {text: "7", value: 7},
            {text: "8", value: 8},
            {text: "9", value: 9},
            {text: "10", value: 10}
        ];

        controller.close = function () {
            $modalInstance.close();
        };

        controller.submitComment = function() {
            var newcomment = {
                 comment: controller.comment,
                 name: loginData.facebook.displayName,
                 userId: loginData.uid,
                 photo: loginData.facebook.profileImageURL,
                 stars: parseInt(controller.stars),
                 months: controller.commentMonths,
                 goal: controller.commentGoal,
                 compatibility: controller.commentCompatibility,
                 knowledge: controller.commentKnowledge,
                 pricequality: controller.commentPricequality,
                 punctuality: controller.commentPunctuality,
                 results: controller.commentResults,
                 timestamp: new Date().getTime()
            };

            if (controller.commentGoal != 0) {
                newcomment.before = controller.before;
                newcomment.after = controller.after;
            }

            db.child(coach.id +'/ratings').push().set(newcomment);

            $modalInstance.close();
        }
    });

    app.controller('PhoneModalController', function($modalInstance, telephone) {
        var controller = this;

        controller.telephone = telephone;

        controller.close = function () {
            $modalInstance.close();
        };
    });

    app.directive('radioButtonGroup', function() {
        return {
            restrict: 'E',
            scope: { model: '=', options: '=', id: '=', name: '=', suffix: '=' },
            controller: function($scope) {
                $scope.activate = function (option, $event) {
                    $scope.model = option[$scope.id];
                    // stop the click event to avoid that Bootstrap toggles the "active" class
                    if ($event.stopPropagation) {
                        $event.stopPropagation();
                    }
                    if ($event.preventDefault) {
                        $event.preventDefault();
                    }
                    $event.cancelBubble = true;
                    $event.returnValue = false;
                };

                $scope.isActive = function(option) {
                    return option[$scope.id] == $scope.model;
                };

                $scope.getName = function (option) {
                    return option[$scope.name];
                }
            },
            template: "<button type='button' class='btn btn-{{suffix}}' " +
                "ng-class='{active: isActive(option)}'" +
                "ng-repeat='option in options' " +
                "ng-click='activate(option, $event)'>{{getName(option)}} " +
                "</button>"
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
                if (items[i] == 3) {
                    str += 'Perder peso';
                }
                if (items[i] == 4) {
                    str += 'Nutrición';
                }
            }
            return str;
        };
    }]);

    app.filter('pricerange',[ function () {
        return function(items) {
            var str = '';
            str = '' + items[0] + '-' + items[1] + '€';
            return str;
        };
    }]);
})();
