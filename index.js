"use strict";

var Flicker = angular.module('flicker-example', ["leonardo"])
  .config(function ($locationProvider) {
    $locationProvider.html5Mode(false);
  })
  .controller('flickerCtrl', function ($scope, flickerGetter) {
    $scope.loadClicked = function () {
      $scope.loading = true;
      flickerGetter.getData().then(function(data){
        $scope.images = data;
        $scope.loading = false;
      }, function () {
        $scope.loading = false;
      });
    }
  });

Flicker.factory('flickerGetter', function ($q, $http) {
  return {
    getData: function () {
      var defer = $q.defer();

      $http.jsonp('http://api.flickr.com/services/feeds/photos_public.gne', {
        params: {
          group_id: 'tmnt',
          format: 'json',
          jsoncallback: 'JSON_CALLBACK'
        }
      }).success(function (data) {
        data = data.items.map(function (item) {
          var author,
            thumbnail = item.media.m;

          angular.forEach(['m.jpg', 'm.gif', 'm.png'], function (item) {
            thumbnail = thumbnail.replace(item, 't.' + item.split('.')[1]);
          });

          author = item.author.split(' ')[1];
          return {
            author_id: item.author_id,
            media: item.media,
            page: item.link,
            title: item.title.length > 60 ? item.title.substr(0, 50) + '...' : item.title,
            author: author,
            date_taken: moment(item.date_taken).format("MMM Do YYYY"),
            thumbnail: thumbnail
          };
        });
        defer.resolve(data);
      }).error(function () {
        defer.resolve();
      });

      return defer.promise;
    }
  };
});
