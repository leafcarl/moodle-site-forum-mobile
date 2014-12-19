angular.module('starter.controllers', [])
  .constant('SERVER_URL', 'http://www.yoursite.com/moodle/') // Your server moodle base URL (with slash at the end)
  .constant('SITE_NAME', 'My Moodle Forum') // Your moodle site name
  .constant('DISCUSSION_PER_PAGE_LIMIT', 10) // Number of discussions per page
  .controller('AppCtrl', function($scope, $ionicModal, $http, $window, $state, $ionicLoading, SERVER_URL, SITE_NAME) {
    // AppCtrl: controller for base layout with side menu
    $scope.loginData = {};
    $scope.posts = null;
    $scope.forums = null;
    $scope.token = null;
    $scope.msg = null;

    // Get last login token
    var token = $window.localStorage['token'];

    // Login modal
    $ionicModal.fromTemplateUrl('view/login.html', {
      scope: $scope,
      backdropClickToClose: false,
      hardwareBackButtonClose: false
    }).then(function(modal) {
      $scope.loginModal = modal;
      checkToken();
    });

    // Error message modal
    $ionicModal.fromTemplateUrl('view/message.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.errorMsgModal = modal;
    });

    // Hide login modal
    closeLogin = function() {
      $scope.loginModal.hide();
    };

    // Show login modal
    $scope.login = function() {
      $scope.loginModal.show();
    };

    // Show error modal
    $scope.showError = function() {
      $scope.errorMsgModal.show();
    }

    // Submit login post request to server
    $scope.doLogin = function() {
      $ionicLoading.show({
        template: 'Loading...'
      });
      $http({
        method: 'POST',
        url: SERVER_URL + "login/token.php",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        transformRequest: function(obj) {
          var str = [];
          for (var p in obj)
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
          return str.join("&");
        },
        data: {
          username: $scope.loginData.username,
          password: $scope.loginData.password,
          service: "moodle_mobile_app"
        }
      }).success(function(data) {
        $ionicLoading.hide();
        if (data.token == null) {
          // Display error message
          $scope.msg = data.error;
          $scope.showError();
        } else {
          // Store token into local storage, get forum with token
          $window.localStorage['token'] = data.token;
          closeLogin();
          doGetForum();
          $scope.loginData = {};
        }
      }).error(function(data) {
        $scope.msg = 'Server error';
        $scope.showError();
      });
    };

    // Logout by clearing token at storage
    $scope.doLogout = function() {
      $window.localStorage.clear();
      $scope.loginData = {};
      $scope.posts = null;
      $scope.forums = null;
      $scope.token = null;
      $scope.msg = null;
      $state.go('app.default');
      checkToken();
    };

    // Prompt login modal when token not found, get forum when token found
    checkToken = function() {
      if ($window.localStorage['token'] == null) {
        $scope.login();
      } else {
        closeLogin();
        doGetForum();
      }
    };

    // Submit post request for forums' details to server
    doGetForum = function() {
      $http({
        method: 'POST',
        url: SERVER_URL + "webservice/rest/server.php?moodlewsrestformat=json",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        transformRequest: function(obj) {
          var str = [];
          for (var p in obj)
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
          return str.join("&");
        },
        data: {
          wstoken: $window.localStorage['token'],
          "courseids[0]": 1, // Only for site-level forum
          wsfunction: "mod_forum_get_forums_by_courses"
        }
      }).success(function(data) {
        // Display forum name
        $scope.forums = data;
      }).error(function(data) {
        $scope.msg = 'Server error';
        $scope.showError();
      });
    };

    // Set siteName (Dynamic request can be done with post request to Moodle webservice API)
    doGetSiteInfo = function() {
      $scope.siteName = SITE_NAME;
    }
    doGetSiteInfo();
  })

.controller('ForumCtrl', function($scope, $http, $window, $stateParams, $state, SERVER_URL, DISCUSSION_PER_PAGE_LIMIT) {
  // ForumCtrl: controller for display dicusssions of the specific forum
  var forumId = $stateParams.forumId;
  var pageNum = $stateParams.pageNum;
  var token = $window.localStorage['token'];
  var discussions = [];

  // Search for current forum name
  angular.forEach($scope.forums, function(item) {
    if (item.id == forumId) {
      $scope.forum = item;
      return;
    }
  });

  // Submit post request for discussions' details to server
  doGetDisccusion = function() {
    $http({
      method: 'POST',
      url: SERVER_URL + "webservice/rest/server.php?moodlewsrestformat=json",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      transformRequest: function(obj) {
        var str = [];
        for (var p in obj)
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        return str.join("&");
      },
      data: {
        wstoken: token,
        forumid: forumId,
        perpage: DISCUSSION_PER_PAGE_LIMIT,
        page: pageNum,
        wsfunction: "mod_forum_get_forum_discussions_paginated"
      }
    }).success(function(data) {
      if (data.discussions == null) {
        $scope.msg = data.message;
        $scope.showError();
      } else {
        // No more disccusions if return posts less than DISCUSSION_PER_PAGE_LIMIT
        $scope.hideMore = (data.discussions.length < DISCUSSION_PER_PAGE_LIMIT);
        angular.forEach(data.discussions, function(item) {
          discussions.push(item);
        });
      }
    }).error(function(data) {
      $scope.msg = 'Server error';
      $scope.showError();
    }).finally(function() {
      $scope.$broadcast('scroll.refreshComplete');
    });
    $scope.discussions = discussions;
  }

  // Pull to refresh
  $scope.doRefresh = function() {
    pageNum = $stateParams.pageNum;
    discussions = [];
    doGetDisccusion();
  }

  // Get next page by requesting next page from server
  $scope.doGetMore = function() {
    pageNum++;
    doGetDisccusion();
  }

  if (token != null) {
    doGetDisccusion();
  } else {
    $scope.login();
    $scope.msg = 'Please login again';
    $scope.showError();
  }
})

.controller('DisucssionCtrl', function($scope, $http, $window, $stateParams, $state, SERVER_URL) {
  // DisucssionCtrl: controller for display posts of specific post
  var discussionId = $stateParams.discussionId;
  var token = $window.localStorage['token'];

  // Submit post request for posts' details to server
  doGetPost = function() {
    $http({
      method: 'POST',
      url: SERVER_URL + "webservice/rest/server.php?moodlewsrestformat=json",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      transformRequest: function(obj) {
        var str = [];
        for (var p in obj)
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        return str.join("&");
      },
      data: {
        wstoken: token,
        discussionid: discussionId,
        sortby: 'created', // Sort by created field
        sortdirection: 'ASC', // Sort in ascending order
        wsfunction: "mod_forum_get_forum_discussion_posts"
      }
    }).success(function(data) {
      if (data.posts == null) {
        $scope.msg = data.message;
        $scope.showError();
      } else {
        // Transform image attachment to html code and append to posts
        angular.forEach(data.posts, function(item) {
          if (item.attachment != "") {
            var imageHtml = "";
            angular.forEach(item.attachments, function(item) {
              if (item.mimetype.indexOf("image") > -1) {
                imageHtml += '<img class="full-image" src="' + item.fileurl + '?token=' + token + '">';
              }
            });
            item.imageHtml = imageHtml;
          }
          // check if post has been modified
          item.show_modified = (item.created != item.modified);
        });
        $scope.posts = data.posts;
        $scope.token = token;
      }
    }).error(function(data) {
      $scope.msg = 'Server error';
      $scope.showError();
    }).finally(function() {
      $scope.$broadcast('scroll.refreshComplete');
    });
  }

  // Pull to refresh
  $scope.doRefresh = function() {
    doGetPost();
  }

  if (token != null) {
    doGetPost();
  } else {
    $scope.login();
    $scope.msg = 'Please login again';
    $scope.showError();
  }

});
