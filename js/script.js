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
    var app = angular.module('fitners', ['ui.bootstrap','sticky','rzModule']);

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
        controller.goalDiet = false;
        controller.goalCond = false;
        controller.gyms = window.gyms;
        controller.areas = ['Eixample', 'Ciutat Vella', 'Gràcia', 'Sant Martí', 'Sarrià-Sant Gervasi', 'Les Corts', 'Sants-Montjuïc', 'Horta-Guinardó', 'Sant Andreu', 'Nou Barris'];
        controller.searchcriteria = 'gym';
        controller.showGoal = false;
        controller.showPrice = false;
        controller.pricerange = [20,60];
        controller.showTraining = false;
        controller.training0 = false;
        controller.training1 = false;
        controller.training2 = false;

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

        function removeAccents(str) {
            str = str.replace(/Á/g, 'A');
            str = str.replace(/É/g, 'E');
            str = str.replace(/Í/g, 'I');
            str = str.replace(/Ó/g, 'O');
            str = str.replace(/Ú/g, 'U');
            str = str.replace(/À/g, 'A');
            str = str.replace(/È/g, 'E');
            str = str.replace(/Ò/g, 'O');
            str = str.replace(/Ü/g, 'U');
            str = str.replace(/Ï/g, 'I');
            return str;
        }

        controller.comparator = function(actual, expected) {
            if (typeof actual != 'string') {
                return false;
            }

            var result = removeAccents(actual.toUpperCase()).search(removeAccents(expected.toUpperCase())) != -1;
            return result;
        }

        function codeGoals() {
            var str = '';

            if(controller.goalVolume) {
                str += 'Volume ';
            }
            if(controller.goalDefinition) {
                str += 'Definition ';
            }
            if(controller.goalWeight) {
                str += 'Weight ';
            }
            if(controller.goalCond) {
                str += 'Condition ';
            }
            if(controller.goalDiet) {
                str += 'Diet';
            }

            return str;
        }

        function codeTraining() {
            var str = '';

            if (controller.training0) {
                str += 'licenciado ';
            }
            if (controller.training1) {
                str += 'TAFAD ';
            }
            if (controller.training2) {
                str += '500horas';
            }

            return str;
        }

        var db = new Firebase('https://fitners.firebaseio.com/coaches/');


        var searchResults;

        controller.searching = true;

        db.orderByChild("rank").on('value', function (snapshot) {
            searchResults = snapshot;
            controller.filter();
        });

        controller.filter = function () {
            controller.results = [];

            if(searchResults.val() === null) {
                controller.searching = false;
                $scope.$apply();
                return;
            }

            if (controller.searchcriteria == 'gym' && controller.gym.length > 0) {
                ga('send', 'event', 'search', 'gymsearch');
            } else if (controller.searchcriteria == 'area' && controller.area.length > 0) {
                ga('send', 'event', 'search', 'areasearch');
            } else {
                ga('send', 'event', 'search', 'allsearch');
            }

            if (controller.showGoal) {
                ga('send', 'event', 'filter', 'by goal', codeGoals());
            }
            if (controller.showPrice) {
                ga('send', 'event', 'filter', 'by price', '' + controller.pricerange[0] + '-' + controller.pricerange[1]);
            }
            if (controller.showTraining) {
                ga('send', 'event', 'filter', 'by training', codeTraining());
            }

            searchResults.forEach(function(data) {
                var value = data.val();
                value.id = data.key();

                if (controller.searchcriteria == 'gym' && controller.gym.length > 0) {
                    var gymid;
                    for (var i = 0; i < controller.gyms.length; i++) {
                        if (controller.gyms[i].name == controller.gym) {
                            gymid = controller.gyms[i].id;
                            break
                        }
                    }
                    if (!value.gym || value.gym != gymid && value.gym.indexOf(gymid) == -1) {
                        return;
                    }
                } else if (controller.searchcriteria == 'area' && controller.area.length > 0) {
                    if (value.area != controller.area && value.area.indexOf(controller.area) == -1) {
                        return;
                    }
                }

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
                    if (controller.goalCond && value.goals.indexOf(4) == -1) {
                        return;
                    }
                    if (controller.goalDiet && value.goals.indexOf(5) == -1) {
                        return;
                    }
                }

                if (controller.showPrice) {
                    if (value.wage < controller.pricerange[0] || value.wage > controller.pricerange[1]) {
                        return;
                    }
                }

                if (controller.showTraining && (controller.training0 || controller.training1 || controller.training2)) {
                    var trainingMatch = false;
                    if(controller.training0 && value.training == 0) {
                        trainingMatch = true;
                    }
                    if(controller.training1 && value.training == 1) {
                        trainingMatch = true;
                    }
                    if(controller.training2 && value.training == 2) {
                        trainingMatch = true;
                    }

                    if(!trainingMatch) {
                        return;
                    }
                }

                controller.results.push(value);
            });

            controller.searching = false;
            $scope.$apply();
        }

        controller.showComments = function(coach) {
            ga('send', 'event', 'navigation', 'show comments', coach.name, controller.results.indexOf(coach));

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
            ga('send', 'event', 'contact', 'show phone', coach.name);

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

        controller.showTerms = function(coach) {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'terms.html'
            });
        }

        controller.emailCoach = function(coach) {
            ga('send', 'event', 'contact', 'email', coach.name);
        }

        controller.callCoach = function(coach) {
            ga('send', 'event', 'contact', 'phone', coach.name);
        }
    });

    app.controller('CommentsModalController', function($scope, $modalInstance, $modal, coach) {
        var controller = this;

        controller.coach = coach;
        controller.ratings = ['knowledge', 'compatibility', 'results', 'punctuality', 'pricequality'];

        controller.showWrite = function() {
            ga('send', 'event', 'navigation', 'addcomment', coach.name);

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

        $scope.keys = Object.keys;
    });

    app.controller('WriteModalController', function($modalInstance, $modal, coach, loginData) {
        var controller = this;

        controller.coach = coach;

        controller.goals = [
            {text: "Volumen", value: 1},
            {text: "Definición", value: 2},
            {text: "Adelgazar", value: 3},
            {text: "Forma física", value: 4},
            {text: "Otro", value: 0}
        ];
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

        controller.goal = undefined;
        controller.months = undefined;
        controller.comment = '';

        function resetAlerts() {
            controller.showGoalAlert = false;
            controller.showWeightAlert = false;
            controller.showDefinitionAlert = false;
            controller.showVolumeAlert = false;
            controller.showMonthsAlert = false;
            controller.showCommentAlert = false;
            controller.showScoreAlert = false;
        }

        resetAlerts();

        controller.close = function () {
            $modalInstance.close();
        };

        controller.submitComment = function() {
            resetAlerts();

            var abort = false;

            if (controller.goal == undefined) {
                controller.showGoalAlert = true;
                abort = true;
            }

            if (controller.goal == 2) {
                if (controller.before && (controller.before < 10 || controller.before > 50)) {
                    controller.showDefinitionAlert = true;
                    abort = true;
                }

                if (controller.after && (controller.after < 10 || controller.after > 50)) {
                    controller.showDefinitionAlert = true;
                    abort = true;
                }
            }

            if(!controller.months) {
                controller.showMonthsAlert = true;
                abort = true;
            }

            if (controller.comment.length < 100) {
                controller.showCommentAlert = true;
                abort = true;
            }

            if (controller.goal == undefined) {
                controller.showGoalAlert = true;
                abort = true;
            }

            if (controller.knowledge == undefined || controller.compatibility == undefined || controller.results == undefined || controller.punctuality == undefined || controller.pricequality == undefined || controller.stars == undefined) {
                controller.showScoreAlert = true;
                abort = true;
            }

            if (abort) {
                return;
            }

            ga('send', 'event', 'navigation', 'submit comment', coach.name);

            var newcomment = {
                 comment: controller.comment,
                 name: loginData.facebook.displayName,
                 userId: loginData.uid,
                 photo: loginData.facebook.profileImageURL,
                 stars: parseInt(controller.stars),
                 months: controller.months,
                 goal: controller.goal,
                 compatibility: controller.compatibility,
                 knowledge: controller.knowledge,
                 pricequality: controller.pricequality,
                 punctuality: controller.punctuality,
                 results: controller.results,
                 timestamp: Firebase.ServerValue.TIMESTAMP
            };

            if (controller.goal != 0) {
                if (controller.before) {
                    newcomment.before = controller.before;
                }
                if (controller.after) {
                    newcomment.after = controller.after;
                }
            }

            db.child(coach.id +'/ratings').push().set(newcomment);

            $modalInstance.close();

            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'done.html',
                controller: 'DoneModalController',
                controllerAs: 'doneCtrl',
                size: 'sm'
            });
        }
    });

    app.controller('DoneModalController', function($modalInstance) {
        var controller = this;

        controller.close = function () {
            $modalInstance.close();
        };
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

    // app.directive('slider', function ($parse) {
    //     return {
    //         restrict: 'E',
    //         replace: true,
    //         template: '',
    //         link: function ($scope, element, attrs) {
    //             var model = $parse(attrs.model);
    //             var slider = $(element[0]).slider();
    //
    //             slider.on('slide', function(ev) {
    //                 model.assign($scope, ev.value);
    //                 $scope.$apply();
    //             });
    //         }
    //     }
    // });
    //
    // app.directive('slider', function ($parse) {
    //     return {
    //         restrict: 'A',
    //         replace: true,
    //         link: function (scope, element, attrs) {
    //             var model = $parse(attrs.ngModel);
    //             var slider = $(element[0]).slider();
    //             slider.on('slide', function(ev) {
    //                 model.assign(scope, ev.value);
    //                 scope.$apply();
    //             });
    //             scope.$watch(attrs.ngModel,function(value) {
    //                 element.slider('setValue',value);
    //             });
    //         }
    //     }
    // });

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
                    str += 'Forma física';
                }
                if (items[i] == 5) {
                    str += 'Nutrición';
                }
            }
            return str;
        };
    }]);

    app.filter('training',[ function () {
        return function(code) {
            var trainings = [
                "Licenciado en Ciencias de la Actividad Física y el Deporte",
                "TAFAD (Técnico superior en Animación y Actividades Físicas y Deportivas)",
                "> 500 horas de formación específica"
            ];

            return trainings[code];
        };
    }]);

    app.filter('pricerange',[ function () {
        return function(items) {
            var str = '';
            str = '' + items[0] + '-' + items[1] + '€';
            return str;
        };
    }]);

    app.filter('areas',[ function () {
        return function(items) {
            var str = '';
            for (i = 0; i < items.length; i++) {
                if (str.length > 0) {
                    str += ', ';
                }
                str += items[i];
            }
            return str;
        };
    }]);
})();
